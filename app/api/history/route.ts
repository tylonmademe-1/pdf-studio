import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserHistory, clearUserHistory, deleteUserHistoryItem } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required to access history." },
      { status: 401 }
    );
  }

  const history = await getUserHistory(user.id);
  return NextResponse.json({ history }, { status: 200 });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    // Delete specific history item belonging to user
    const deleted = await deleteUserHistoryItem(user.id, id);
    return NextResponse.json({ success: deleted }, { status: 200 });
  }

  // Clear all history for current user
  await clearUserHistory(user.id);
  return NextResponse.json({ success: true }, { status: 200 });
}
