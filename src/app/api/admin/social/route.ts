import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    await requireAuth();
    const result = await sql`SELECT * FROM social_links ORDER BY sort_order`;
    return NextResponse.json(result.rows);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth();
    const { label, handle, href, icon } = await request.json();
    const result = await sql`
      INSERT INTO social_links (label, handle, href, icon, sort_order)
      VALUES (${label}, ${handle}, ${href}, ${icon}, (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM social_links))
      RETURNING *
    `;
    return NextResponse.json(result.rows[0]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAuth();
    const { id, label, handle, href, icon } = await request.json();
    await sql`
      UPDATE social_links SET label = ${label}, handle = ${handle}, href = ${href}, icon = ${icon}
      WHERE id = ${id}
    `;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAuth();
    const { id } = await request.json();
    await sql`DELETE FROM social_links WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
