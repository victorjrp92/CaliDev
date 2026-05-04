import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    await requireAuth();
    const result = await sql`SELECT * FROM hero_content ORDER BY locale`;
    return NextResponse.json(result.rows);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAuth();
    const { locale, headline, subtitle, cta_services, cta_schedule, photo_url, photo_position } = await request.json();

    await sql`
      INSERT INTO hero_content (locale, headline, subtitle, cta_services, cta_schedule, photo_url, photo_position)
      VALUES (${locale}, ${headline}, ${subtitle}, ${cta_services}, ${cta_schedule}, ${photo_url}, ${photo_position || '50% 25%'})
      ON CONFLICT (locale) DO UPDATE SET
        headline = ${headline},
        subtitle = ${subtitle},
        cta_services = ${cta_services},
        cta_schedule = ${cta_schedule},
        photo_url = COALESCE(${photo_url}, hero_content.photo_url),
        photo_position = COALESCE(${photo_position}, hero_content.photo_position),
        updated_at = NOW()
    `;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
