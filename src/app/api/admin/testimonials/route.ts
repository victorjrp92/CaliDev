import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { deleteImage } from "@/lib/blob";

export async function GET() {
  try {
    await requireAuth();
    const result = await sql`
      SELECT t.*, json_agg(json_build_object('locale', ti.locale, 'quote', ti.quote)) as translations
      FROM testimonials t
      LEFT JOIN testimonials_i18n ti ON t.id = ti.testimonial_id
      GROUP BY t.id
      ORDER BY t.sort_order
    `;
    return NextResponse.json(result.rows);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth();
    const { author, role, rating, translations, avatar_url } = await request.json();

    const result = await sql`
      INSERT INTO testimonials (author, role, rating, avatar_url, sort_order)
      VALUES (${author}, ${role}, ${rating || 5}, ${avatar_url || null}, (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM testimonials))
      RETURNING id
    `;
    const tid = result.rows[0].id;

    for (const t of translations) {
      await sql`
        INSERT INTO testimonials_i18n (testimonial_id, locale, quote)
        VALUES (${tid}, ${t.locale}, ${t.quote})
      `;
    }

    return NextResponse.json({ success: true, id: tid });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAuth();
    const { id, author, role, rating, translations, avatar_url } = await request.json();

    if (avatar_url !== undefined) {
      const old = await sql`SELECT avatar_url FROM testimonials WHERE id = ${id}`;
      if (old.rows[0]?.avatar_url && old.rows[0].avatar_url !== avatar_url) {
        await deleteImage(old.rows[0].avatar_url);
      }
    }

    await sql`
      UPDATE testimonials SET author = ${author}, role = ${role}, rating = ${rating},
      avatar_url = COALESCE(${avatar_url}, avatar_url)
      WHERE id = ${id}
    `;

    for (const t of translations) {
      await sql`
        INSERT INTO testimonials_i18n (testimonial_id, locale, quote)
        VALUES (${id}, ${t.locale}, ${t.quote})
        ON CONFLICT (testimonial_id, locale) DO UPDATE SET quote = ${t.quote}
      `;
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAuth();
    const { id } = await request.json();

    const old = await sql`SELECT avatar_url FROM testimonials WHERE id = ${id}`;
    if (old.rows[0]?.avatar_url) {
      await deleteImage(old.rows[0].avatar_url);
    }

    await sql`DELETE FROM testimonials WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
