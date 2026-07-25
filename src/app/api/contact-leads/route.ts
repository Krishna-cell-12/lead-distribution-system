import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// ─── POST /api/contact-leads ──────────────────────────────────────────────────
// Creates a new inbound lead from the public landing page form.
// Server-side validation mirrors the client-side rules.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, budget, message } = body;

    // ── Validation ──────────────────────────────────────────────────────────
    const errors: Record<string, string> = {};

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      errors.email = 'A valid email address is required.';
    }

    const validBudgets = ['under_500', '500_2000', '2000_10000', '10000_plus'];
    if (!budget || !validBudgets.includes(budget)) {
      errors.budget = 'Please select a budget range.';
    }

    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters.';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: 'Validation failed', fields: errors }, { status: 422 });
    }

    // ── Insert ───────────────────────────────────────────────────────────────
    const lead = await prisma.contactLead.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        budget,
        message: message.trim(),
      },
    });

    return NextResponse.json({ success: true, lead }, { status: 201 });
  } catch (error) {
    console.error('Failed to create contact lead:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ─── GET /api/contact-leads ───────────────────────────────────────────────────
// Returns all leads for the admin panel, newest first.
export async function GET() {
  try {
    const leads = await prisma.contactLead.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ leads });
  } catch (error) {
    console.error('Failed to fetch contact leads:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
