import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await sql`
      SELECT s.*, COALESCE(json_agg(json_build_object('locale', si.locale, 'title', si.title, 'description', si.description, 'benefit1', si.benefit1, 'benefit2', si.benefit2, 'benefit3', si.benefit3)) FILTER (WHERE si.locale IS NOT NULL), '[]'::json) as translations
      FROM services s
      LEFT JOIN services_i18n si ON s.id = si.service_id
      GROUP BY s.id
      ORDER BY s.sort_order
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
    const { id, slug, icon, image_url, translations } = await request.json();

    await sql`UPDATE services SET slug = ${slug}, icon = ${icon}, image_url = ${image_url || null} WHERE id = ${id}`;

    for (const t of translations) {
      await sql`
        INSERT INTO services_i18n (service_id, locale, title, description, benefit1, benefit2, benefit3)
        VALUES (${id}, ${t.locale}, ${t.title}, ${t.description}, ${t.benefit1 || null}, ${t.benefit2 || null}, ${t.benefit3 || null})
        ON CONFLICT (service_id, locale) DO UPDATE SET
          title = ${t.title}, description = ${t.description},
          benefit1 = ${t.benefit1 || null}, benefit2 = ${t.benefit2 || null}, benefit3 = ${t.benefit3 || null}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
