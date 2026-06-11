// Backup soberano do banco Law Sovereign.
// Exporta todas as tabelas para um JSON local timestampado.
// Uso: DATABASE_URL="<url de producao>" node scripts/backup-db.cjs
// Pode virar cron diario. Os arquivos vao para server/backups/ (gitignored).

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

(async () => {
  console.log('🔄 Exportando banco...');
  const dump = {
    exportedAt: new Date().toISOString(),
    tenants: await prisma.tenant.findMany(),
    clients: await prisma.client.findMany(),
    events: await prisma.timelineEvent.findMany(),
    auditLogs: await prisma.auditLog.findMany(),
  };

  const dir = path.join(__dirname, '..', 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(dir, `backup-${stamp}.json`);
  fs.writeFileSync(file, JSON.stringify(dump, null, 2));

  console.log(`✅ Backup salvo: ${file}`);
  console.log(`   tenants=${dump.tenants.length} clients=${dump.clients.length} events=${dump.events.length} audit=${dump.auditLogs.length}`);
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error('❌ Falha no backup:', e.message);
  await prisma.$disconnect();
  process.exit(1);
});
