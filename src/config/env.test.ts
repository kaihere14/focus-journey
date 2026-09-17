import { envSchema } from "./env";

describe("envSchema", () => {
  it("accepts a valid config and defaults NODE_ENV", () => {
    const result = envSchema.parse({
      DATABASE_URL: "postgres://localhost/db",
    });

    expect(result.NODE_ENV).toBe("development");
    expect(result.NEXT_PUBLIC_MAPBOX_TOKEN).toBeUndefined();
  });

  it("rejects a missing DATABASE_URL", () => {
    expect(() => envSchema.parse({})).toThrow();
  });

  it("rejects an empty DATABASE_URL", () => {
    expect(() => envSchema.parse({ DATABASE_URL: "" })).toThrow();
  });

  it("rejects an invalid NODE_ENV", () => {
    expect(() =>
      envSchema.parse({
        DATABASE_URL: "postgres://localhost/db",
        NODE_ENV: "staging",
      }),
    ).toThrow();
  });
});
