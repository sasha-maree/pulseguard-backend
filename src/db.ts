import { PrismaClient } from "@prisma/client";

// Global database connection instance
export const prisma = new PrismaClient();