import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const migrate = searchParams.get("migrate");

  if (migrate === "true") {
    const results: string[] = [];
    try {
      await sql`ALTER TABLE hero_content ADD COLUMN IF NOT EXISTS photo_position TEXT DEFAULT '50% 25%'`;
      results.push("hero_content.photo_position: OK");
    } catch (err) {
      results.push(`hero_content.photo_position: ${err instanceof Error ? err.message : "failed"}`);
    }
    try {
      await sql`ALTER TABLE services ADD COLUMN IF NOT EXISTS image_url TEXT`;
      results.push("services.image_url: OK");
    } catch (err) {
      results.push(`services.image_url: ${err instanceof Error ? err.message : "failed"}`);
    }
    return NextResponse.json({ migrated: true, results });
  }

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
