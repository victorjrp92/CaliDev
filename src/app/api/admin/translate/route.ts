import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const localeNames: Record<string, string> = {
  es: "Spanish",
  de: "German",
};

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

      const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `Translate the following fields from English to ${langName}. Return ONLY a JSON object with the same keys and translated values. Keep brand names, technical terms, and proper nouns unchanged. Be natural and professional.\n\n${fieldsBlock}`,
          },
        ],
      });

      const text = message.content[0].type === "text" ? message.content[0].text : "";
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
