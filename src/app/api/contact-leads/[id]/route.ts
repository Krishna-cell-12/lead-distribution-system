import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ─── PATCH /api/contact-leads/[id] ───────────────────────────────────────────
// Cycles the status of a lead: NEW → CONTACTED → CLOSED → NEW
// Called by the admin panel's status toggle button.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const validStatuses = ['NEW', 'CONTACTED', 'CLOSED'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be NEW, CONTACTED, or CLOSED.' },
        { status: 400 }
      );
    }

    const existing = await prisma.contactLead.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
    }

    const updated = await prisma.contactLead.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, lead: updated });
  } catch (error) {
    console.error('Failed to update lead status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
