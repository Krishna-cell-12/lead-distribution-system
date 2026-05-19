import { prisma } from '@/lib/prisma';
import ClientTester from './ClientTester';

export const dynamic = 'force-dynamic';

export default async function TestToolsPage() {
  const providers = await prisma.provider.findMany({
    orderBy: { name: 'asc' },
  });

  const services = await prisma.service.findMany({
    orderBy: { name: 'asc' },
  });

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px', fontFamily: 'sans-serif' }}>
      <h1>🛠️ Testing Panel</h1>
      <p style={{ color: '#555', marginTop: '0', marginBottom: '24px' }}>
        Utility panel to verify transaction concurrency safety and idempotent webhook quota resets.
      </p>

      <ClientTester
        providers={providers.map(p => ({ id: p.id, name: p.name, quota: p.quota, currentMonthLeads: p.currentMonthLeads }))}
        services={services.map(s => ({ id: s.id, name: s.name }))}
      />
    </div>
  );
}
