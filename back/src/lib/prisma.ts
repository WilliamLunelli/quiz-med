import { PrismaClient } from '@prisma/client';

/**
 * Instância única do PrismaClient reaproveitada em todo o processo.
 * Em dev com hot-reload evita esgotar o pool de conexões.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
