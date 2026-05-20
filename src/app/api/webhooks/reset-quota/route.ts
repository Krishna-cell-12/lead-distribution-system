import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  // 1. Extract providerId and idempotencyKey from the request body
  let providerId: string;
  let idempotencyKey: string;

  try {
    const body = await request.json();
    providerId = body?.providerId;
    idempotencyKey = body?.idempotencyKey;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!providerId || typeof providerId !== 'string' || providerId.trim() === '') {
    return NextResponse.json({ error: 'providerId is required' }, { status: 400 });
  }
  if (!idempotencyKey || typeof idempotencyKey !== 'string' || idempotencyKey.trim() === '') {
    return NextResponse.json({ error: 'idempotencyKey is required' }, { status: 400 });
  }

  // 2. Wrap all database operations in a try/catch
  try {
    // 3. Check ProcessedWebhook table for the key — return 200 immediately if duplicate
    const existing = await prisma.processedWebhook.findUnique({
      where: { idempotencyKey },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: true,
          duplicated: true,
          message: 'Webhook idempotency key already processed. Database state remained unchanged.',
        },
        { status: 200 }
      );
    }

    // 4. New key — run a transaction to create the record and reset the quota
    await prisma.$transaction(async (tx) => {
      // a) Create the record in ProcessedWebhook
      await tx.processedWebhook.create({
        data: { idempotencyKey },
      });

      // b) Reset the provider's currentMonthLeads back to 0
      await tx.provider.update({
        where: { id: providerId },
        data: { currentMonthLeads: 0 },
      });
    });

    return NextResponse.json(
      {
        success: true,
        duplicated: false,
        message: 'Provider currentMonthLeads reset successfully.',
      },
      { status: 200 }
    );

  } catch (error: any) {
    // 5. Log the exact error message so we can see what Prisma is complaining about
    console.log('Webhook reset-quota error:', error?.message ?? error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
