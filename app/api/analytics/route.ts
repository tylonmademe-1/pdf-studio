import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getAnalyticsSummary } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const timeRange = (searchParams.get("timeRange") || "7d") as "24h" | "7d" | "30d" | "all";
    const category = searchParams.get("category") || "all";
    const scope = searchParams.get("scope") || "global";

    let userId: string | undefined = undefined;
    if (scope === "user") {
      const user = await getCurrentUser();
      if (user) {
        userId = user.id;
      }
    }

    const summary = await getAnalyticsSummary({
      userId,
      timeRange,
      categoryFilter: category,
    });

    return NextResponse.json(summary, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
