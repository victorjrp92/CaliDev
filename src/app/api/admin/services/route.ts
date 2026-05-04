import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    await requireAuth();
    const result = await sql`
      SELECT s.*, json_agg(json_build_object('locale', si.locale, 'title', si.title, 'description', si.description)) as translations
      FROM services s
      LEFT JOIN services_i18n si ON s.id = si.service_id
      GROUP BY s.id
      ORDER BY s.sort_order
    `;
    return NextResponse.json(result.rows);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAuth();
    const { id, slug, icon, translations } = await request.json();

    await sql`UPDATE services SET slug = ${slug}, icon = ${icon} WHERE id = ${id}`;

    for (const t of translations) {
      await sql`
        INSERT INTO services_i18n (service_id, locale, title, description)
        VALUES (${id}, ${t.locale}, ${t.title}, ${t.description})
        ON CONFLICT (service_id, locale) DO UPDATE SET
          title = ${t.title}, description = ${t.description}
      `;
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
