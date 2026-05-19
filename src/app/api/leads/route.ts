import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerName, phoneNumber, serviceId } = body;

    // Validate request inputs
    if (!customerName || typeof customerName !== 'string' || customerName.trim() === '') {
      return NextResponse.json({ error: 'customerName is required' }, { status: 400 });
    }
    if (!phoneNumber || typeof phoneNumber !== 'string' || phoneNumber.trim() === '') {
      return NextResponse.json({ error: 'phoneNumber is required' }, { status: 400 });
    }
    if (!serviceId || typeof serviceId !== 'string' || serviceId.trim() === '') {
      return NextResponse.json({ error: 'serviceId is required' }, { status: 400 });
    }

    // Execute atomic transaction for distribution
    const result = await prisma.$transaction(async (tx) => {
      // Acquire pessimistic locks on Provider table to prevent concurrent race conditions / quota overruns
      await tx.$queryRawUnsafe('SELECT id FROM "Provider" FOR UPDATE');

      // 1. Check if a lead with this phoneNumber and serviceId already exists
      const existingLead = await tx.lead.findUnique({
        where: {
          phoneNumber_serviceId: {
            phoneNumber,
            serviceId,
          },
        },
      });

      if (existingLead) {
        throw { code: 'DUPLICATE_LEAD', message: 'A customer cannot request the same service twice.' };
      }

      // Verify the service exists
      const service = await tx.service.findUnique({
        where: { id: serviceId },
      });
      if (!service) {
        throw { code: 'SERVICE_NOT_FOUND', message: 'Service not found.' };
      }

      // Fetch all providers with their latest assignment timestamp
      const providers = await tx.provider.findMany({
        include: {
          assignments: {
            orderBy: { assignedAt: 'desc' },
            take: 1,
          },
        },
      });

      // Filter available providers who have not exceeded their quota (currentMonthLeads < quota)
      const availableProviders = providers.filter(
        (p) => p.currentMonthLeads < p.quota
      );

      // Check if we have at least 3 eligible providers in total
      if (availableProviders.length < 3) {
        throw { code: 'INSUFFICIENT_QUOTA', message: 'Fewer than 3 providers have available quota.' };
      }

      const selectedProviders: typeof providers = [];

      // 3. Apply Mandatory Routing:
      // If serviceId matches a specific service (e.g., Service A), Provider 1 MUST be included in the 3 assignments if their quota allows.
      // Target Service: 'Web Development'. Target Provider: 'Provider 1'.
      const isWebDevService = service.name === 'Web Development';
      const provider1 = availableProviders.find((p) => p.name === 'Provider 1');

      if (isWebDevService && provider1) {
        selectedProviders.push(provider1);
      }

      // Filter out already selected providers from candidates list
      const remainingCandidates = availableProviders.filter(
        (p) => !selectedProviders.some((sp) => sp.id === p.id)
      );

      // 4. Apply Round-Robin:
      // Sort remaining candidates by their latest assignment time ascending (never assigned gets priority 0)
      remainingCandidates.sort((a, b) => {
        const timeA = a.assignments[0]?.assignedAt.getTime() || 0;
        const timeB = b.assignments[0]?.assignedAt.getTime() || 0;
        return timeA - timeB;
      });

      // Select providers from sorted list until we have exactly 3 selected
      while (selectedProviders.length < 3 && remainingCandidates.length > 0) {
        const nextProvider = remainingCandidates.shift();
        if (nextProvider) {
          selectedProviders.push(nextProvider);
        }
      }

      // If for some reason we still couldn't select 3, fail gracefully
      if (selectedProviders.length < 3) {
        throw { code: 'INSUFFICIENT_QUOTA', message: 'Fewer than 3 providers are available for distribution.' };
      }

      // 5. Insert Lead record
      const lead = await tx.lead.create({
        data: {
          customerName,
          phoneNumber,
          serviceId,
        },
      });

      // 6. Insert 3 LeadAssignments and update Providers quota count
      const assignments = [];
      for (const provider of selectedProviders) {
        // Create LeadAssignment record
        const assignment = await tx.leadAssignment.create({
          data: {
            leadId: lead.id,
            providerId: provider.id,
          },
        });
        assignments.push(assignment);

        // Update provider currentMonthLeads
        await tx.provider.update({
          where: { id: provider.id },
          data: {
            currentMonthLeads: { increment: 1 },
          },
        });
      }

      return { lead, selectedProviders, assignments };
    });

    return NextResponse.json({
      success: true,
      lead: result.lead,
      assignedProviders: result.selectedProviders.map(p => ({ id: p.id, name: p.name, currentMonthLeads: p.currentMonthLeads + 1, quota: p.quota })),
      assignments: result.assignments,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Lead submission failed:', error);
    
    // Handle our custom throw errors
    if (error.code === 'DUPLICATE_LEAD') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error.code === 'SERVICE_NOT_FOUND') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error.code === 'INSUFFICIENT_QUOTA') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Default error response
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
