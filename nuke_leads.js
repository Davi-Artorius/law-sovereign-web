const { PrismaClient } = require('./server/node_modules/@prisma/client');

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: { url: 'postgresql://admin:sovereign_pass@localhost:5432/law_sovereign?schema=public' }
    }
  });
  try {
    const result = await prisma.client.deleteMany({});
    console.log(`✓ Deletados ${result.count} leads`);
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
