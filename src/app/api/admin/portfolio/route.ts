import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    await requireAuth();
    const result = await sql`SELECT * FROM portfolio_content ORDER BY locale`;
    return NextResponse.json(result.rows);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAuth();
    const data = await request.json();
    const { locale } = data;

    await sql`
      INSERT INTO portfolio_content (locale, badge, title, role, description, profile_name, profile_subtitle, profile_bio, cta, highlight1_title, highlight1_desc, highlight2_title, highlight2_desc, highlight3_title, highlight3_desc)
      VALUES (${locale}, ${data.badge}, ${data.title}, ${data.role}, ${data.description}, ${data.profile_name}, ${data.profile_subtitle}, ${data.profile_bio}, ${data.cta}, ${data.highlight1_title}, ${data.highlight1_desc}, ${data.highlight2_title}, ${data.highlight2_desc}, ${data.highlight3_title}, ${data.highlight3_desc})
      ON CONFLICT (locale) DO UPDATE SET
        badge = ${data.badge}, title = ${data.title}, role = ${data.role}, description = ${data.description},
        profile_name = ${data.profile_name}, profile_subtitle = ${data.profile_subtitle}, profile_bio = ${data.profile_bio},
        cta = ${data.cta},
        highlight1_title = ${data.highlight1_title}, highlight1_desc = ${data.highlight1_desc},
        highlight2_title = ${data.highlight2_title}, highlight2_desc = ${data.highlight2_desc},
        highlight3_title = ${data.highlight3_title}, highlight3_desc = ${data.highlight3_desc},
        updated_at = NOW()
    `;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
