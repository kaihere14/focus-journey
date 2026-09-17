import type { NextRequest } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { prisma } from "@/server/db/client";

export async function POST(req: NextRequest) {
  let event;

  try {
    event = await verifyWebhook(req);
  } catch {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  switch (event.type) {
    case "user.created": {
      const clerkUserId = event.data.id;
      await prisma.user.upsert({
        where: { clerkUserId },
        update: {},
        create: { clerkUserId },
      });
      break;
    }
    case "user.deleted": {
      const clerkUserId = event.data.id;
      if (clerkUserId) {
        await prisma.user.deleteMany({ where: { clerkUserId } });
      }
      break;
    }
  }

  return new Response("OK", { status: 200 });
}
