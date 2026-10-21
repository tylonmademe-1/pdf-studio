import { NextResponse } from "next/server";
import { stirlingClient } from "@/lib/stirling/client";

export async function GET() {
  const engineHealth = await stirlingClient.checkHealth();

  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      app: {
        name: "PDF Studio",
        version: "1.0.0",
        environment: process.env.NODE_ENV || "development",
        status: "healthy",
      },
      engine: {
        configuredUrl: engineHealth.url,
        reachable: engineHealth.reachable,
        mode: engineHealth.reachable ? "stirling-active" : "native-fallback-active",
      },
    },
    { status: 200 }
  );
}
