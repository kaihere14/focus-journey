import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().optional(),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

export type Env = z.infer<typeof envSchema>;
