import { prisma } from '@/lib/prisma';
import ProviderDashboardClient from './ProviderDashboardClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function getProviderData(providerId: string) {
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

  if (!provider) return null;

  return {
    id: provider.id,
    name: provider.name,
    quota: provider.quota,
    currentMonthLeads: provider.currentMonthLeads,
    leads: provider.assignments.map((assignment: {
      assignedAt: Date;
      lead: {
        customerName: string;
        phoneNumber: string;
      };
    }) => ({
      customerName: assignment.lead.customerName,
      phoneNumber: assignment.lead.phoneNumber,
      assignedAt: assignment.assignedAt.toISOString(),
    })),
  };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ providerId?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const providerId = resolvedSearchParams.providerId;

  if (!providerId) {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <h1>Provider Dashboard</h1>
        <p style={{ color: 'red' }}>Error: providerId query parameter is required. E.g. `/dashboard?providerId=XYZ`</p>
      </div>
    );
  }

  const initialData = await getProviderData(providerId);

  if (!initialData) {
    notFound();
  }

  return (
    <ProviderDashboardClient
      providerId={providerId}
      initialData={initialData}
    />
  );
}
