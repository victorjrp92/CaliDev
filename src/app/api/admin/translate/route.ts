import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const localeNames: Record<string, string> = {
  es: "Spanish",
  de: "German",
};

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }

  try {
    const { fields, targetLocales } = await request.json() as {
      fields: Record<string, string>;
      targetLocales: string[];
    };

    const fieldEntries = Object.entries(fields).filter(([, v]) => v?.trim());
    if (fieldEntries.length === 0) {
      return NextResponse.json({ error: "No fields to translate" }, { status: 400 });
    }

    const fieldsBlock = fieldEntries
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");

    const results: Record<string, Record<string, string>> = {};

    for (const locale of targetLocales) {
      const langName = localeNames[locale] || locale;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Translate the following fields from English to ${langName}. Return ONLY a JSON object with the same keys and translated values. Keep brand names, technical terms, and proper nouns unchanged. Be natural and professional.\n\n${fieldsBlock}`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!res.ok) {
        console.error("Gemini API error:", await res.text());
        continue;
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        results[locale] = JSON.parse(jsonMatch[0]);
      }
    }

    return NextResponse.json({ translations: results });
  } catch (err) {
    console.error("Translation error:", err);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
