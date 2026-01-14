let prisma = null;

try {
  const { PrismaClient } = require('@prisma/client');
  const globalForPrisma = global;
  prisma = globalForPrisma.prisma || new PrismaClient();
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
} catch (e) {
  console.warn('Prisma client not available. Install dependencies and run prisma generate/migrate.', e.message);
}

module.exports = prisma;
