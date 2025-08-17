// Serviço do Prisma para Cloudflare D1
import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import type { Context } from 'hono';

// Instância global do Prisma Client (para reutilização)
let prismaInstance: PrismaClient | null = null;

/**
 * Cria e configura uma instância do Prisma Client para Cloudflare D1
 * @param d1Database - Instância do D1Database do Cloudflare
 * @returns Instância configurada do Prisma Client
 */
export const createPrismaClient = (d1Database: D1Database): PrismaClient => {
  // Reutilizar instância existente se possível (otimização)
  if (prismaInstance) {
    return prismaInstance;
  }

  // Criar adapter D1 para Prisma
  const adapter = new PrismaD1(d1Database);
  
  // Criar cliente Prisma com adapter D1
  prismaInstance = new PrismaClient({ 
    adapter,
    log: ['error', 'warn'], // Logs apenas para erros e warnings
  });

  return prismaInstance;
};

/**
 * Helper para obter Prisma Client configurado a partir do contexto Hono
 * @param c - Contexto do Hono com binding D1
 * @returns Instância do Prisma Client
 */
export const getPrismaFromContext = (c: Context): PrismaClient => {
  return createPrismaClient(c.env.DB);
};

/**
 * Cleanup da instância do Prisma (útil para testes)
 */
export const resetPrismaInstance = (): void => {
  if (prismaInstance) {
    prismaInstance.$disconnect();
    prismaInstance = null;
  }
};

/**
 * Tipos utilitários para facilitar o uso
 */
export type PrismaTransaction = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];
export type NotificationWhereInput = Parameters<PrismaClient['notification']['findMany']>[0]['where'];
export type NotificationCreateInput = Parameters<PrismaClient['notification']['create']>[0]['data'];
export type NotificationUpdateInput = Parameters<PrismaClient['notification']['update']>[0]['data'];
