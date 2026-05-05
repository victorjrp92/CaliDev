import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const result = await sql`
      SELECT s.id, s.slug, s.icon, s.image_url, s.sort_order
      FROM services s
      ORDER BY s.sort_order
    `;
    return NextResponse.json({
      ok: true,
      count: result.rows.length,
      services: result.rows,
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
