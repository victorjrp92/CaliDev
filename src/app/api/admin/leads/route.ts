import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    // Los descartados y los referidos van al final, no se pierden.
    const result = await sql`
      SELECT * FROM leads
      ORDER BY qualified DESC, score_total DESC, created_at DESC
    `;
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id, status, notes } = await request.json();
    await sql`
      UPDATE leads
      SET status = COALESCE(${status}, status),
          notes = COALESCE(${notes}, notes),
          updated_at = NOW()
      WHERE id = ${id}
    `;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await request.json();
    await sql`DELETE FROM leads WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
