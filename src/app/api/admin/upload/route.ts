import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { replaceImage } from "@/lib/blob";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "uploads";
    const oldUrl = formData.get("oldUrl") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // File size validation (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    // File type allowlist
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: `Invalid file type. Allowed: ${allowedTypes.join(", ")}` }, { status: 400 });
    }

    // Folder allowlist
    const allowedFolders = ["hero", "services", "testimonials", "uploads"];
    if (!allowedFolders.includes(folder)) {
      return NextResponse.json({ error: `Invalid folder. Allowed: ${allowedFolders.join(", ")}` }, { status: 400 });
    }

    const url = await replaceImage(file, oldUrl, folder);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
