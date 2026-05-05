import { put, del, list } from "@vercel/blob";

export async function uploadImage(
  file: File,
  folder: string
): Promise<string> {
  const sanitizedName = file.name.replace(/[\/\\]/g, "").replace(/[^a-zA-Z0-9.\-]/g, "_");
  const filename = `${folder}/${Date.now()}-${sanitizedName}`;
  const blob = await put(filename, file, {
    access: "public",
    addRandomSuffix: false,
  });
  return blob.url;
}

export async function deleteImage(url: string) {
  if (!url.includes(".public.blob.vercel-storage.com")) {
    return;
  }
  try {
    await del(url);
  } catch {
    // Blob may already be deleted
  }
}

export async function replaceImage(
  newFile: File,
  oldUrl: string | null,
  folder: string
): Promise<string> {
  const newUrl = await uploadImage(newFile, folder);
  if (oldUrl) {
    await deleteImage(oldUrl);
  }
  return newUrl;
}

export async function listImages(prefix: string) {
  const { blobs } = await list({ prefix });
  return blobs;
}
