import { prisma } from "@/server/db/client";
import { requireAuthUserId } from "@/server/auth/current-user";
import type { User } from "@/generated/prisma/client";

export async function getOrCreateUser(): Promise<User> {
  const clerkUserId = await requireAuthUserId();

  const existing = await prisma.user.findUnique({
    where: { clerkUserId },
  });

  if (existing) {
    return existing;
  }

  return prisma.user.create({
    data: { clerkUserId },
  });
}
