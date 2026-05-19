import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { providerId, idempotencyKey } = body;

    // 1. Validate inputs
    if (!providerId || typeof providerId !== 'string' || providerId.trim() === '') {
      return NextResponse.json({ error: 'providerId is required' }, { status: 400 });
    }
    if (!idempotencyKey || typeof idempotencyKey !== 'string' || idempotencyKey.trim() === '') {
      return NextResponse.json({ error: 'idempotencyKey is required' }, { status: 400 });
    }

    // UUID basic validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(idempotencyKey)) {
      return NextResponse.json({ error: 'idempotencyKey must be a valid UUID' }, { status: 400 });
    }

    // 2. Atomic transaction to ensure idempotency and quota updates
    const result = await prisma.$transaction(async (tx) => {
      // Check if key already exists
      const processed = await tx.processedWebhook.findUnique({
        where: { idempotencyKey },
      });

      if (processed) {
        return { duplicated: true };
      }

      // Check if the provider exists
      const provider = await tx.provider.findUnique({
        where: { id: providerId },
      });
      if (!provider) {
        throw { code: 'PROVIDER_NOT_FOUND', message: 'Provider not found.' };
      }

      // Save processed key
      await tx.processedWebhook.create({
        data: { idempotencyKey },
      });

      // Reset the provider currentMonthLeads to 0
      await tx.provider.update({
        where: { id: providerId },
        data: { currentMonthLeads: 0 },
      });

      return { duplicated: false };
    });

    if (result.duplicated) {
      return NextResponse.json({
        success: true,
        duplicated: true,
        message: 'Webhook idempotency key already processed. Database state remained unchanged.',
      }, { status: 200 });
    }

    return NextResponse.json({
      success: true,
      duplicated: false,
      message: 'Provider currentMonthLeads reset successfully.',
    }, { status: 200 });

  } catch (error: any) {
    console.error('Webhook reset-quota failed:', error);
    if (error.code === 'PROVIDER_NOT_FOUND') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
