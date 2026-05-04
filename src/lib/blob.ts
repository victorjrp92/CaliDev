import { put, del, list } from "@vercel/blob";

export async function uploadImage(
  file: File,
  folder: string
): Promise<string> {
  const filename = `${folder}/${Date.now()}-${file.name}`;
  const blob = await put(filename, file, {
    access: "public",
    addRandomSuffix: false,
  });
  return blob.url;
}

export async function deleteImage(url: string) {
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
