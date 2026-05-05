import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  return NextResponse.json({ success: true, results });
}
