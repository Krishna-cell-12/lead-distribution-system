import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json({ error: 'providerId query parameter is required' }, { status: 400 });
    }

    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: {
        id: true,
        name: true,
        quota: true,
        currentMonthLeads: true,
        assignments: {
          select: {
            assignedAt: true,
            lead: {
              select: {
                customerName: true,
                phoneNumber: true,
              },
            },
          },
          orderBy: {
            assignedAt: 'desc',
          },
        },
      },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Format assigned leads nicely
    const leads = provider.assignments.map((assignment) => ({
      customerName: assignment.lead.customerName,
      phoneNumber: assignment.lead.phoneNumber,
      assignedAt: assignment.assignedAt.toISOString(),
    }));

    return NextResponse.json({
      id: provider.id,
      name: provider.name,
      quota: provider.quota,
      currentMonthLeads: provider.currentMonthLeads,
      leads,
    });
  } catch (error) {
    console.error('Failed to fetch provider details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
