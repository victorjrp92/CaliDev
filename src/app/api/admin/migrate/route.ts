import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await sql`ALTER TABLE services_i18n ADD COLUMN IF NOT EXISTS benefit1 TEXT`;
    await sql`ALTER TABLE services_i18n ADD COLUMN IF NOT EXISTS benefit2 TEXT`;
    await sql`ALTER TABLE services_i18n ADD COLUMN IF NOT EXISTS benefit3 TEXT`;
    return NextResponse.json({ success: true, message: "Migration complete: benefit columns added" });
  } catch (err) {
    console.error("Migration error:", err);
    return NextResponse.json({ error: "Migration failed" }, { status: 500 });
  }
}
