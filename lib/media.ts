import { resizeImage } from "@/lib/image";
import { mediaStore } from "@/lib/mediaStore";
import { uid } from "@/lib/utils";

export const MAX_VIDEO_BYTES = 80 * 1024 * 1024;

export interface ProcessedMedia {
  kind: "image" | "video";
  /** Image data URL (images only). */
  src?: string;
  /** IndexedDB blob key (videos only). */
  mediaId?: string;
}

/**
 * Prepares a picked/captured file for app storage. Images are downscaled into data URLs; videos are kept as blobs
 * in the app's own IndexedDB. Nothing is saved to the phone's camera roll.
 */
export async function processMediaFile(file: File, maxSide = 1000): Promise<ProcessedMedia> {
  if (file.type.startsWith("video/")) {
    if (file.size > MAX_VIDEO_BYTES) throw new Error("That video is over 80 MB. Choose a shorter clip.");
    const mediaId = uid();
    await mediaStore.put(mediaId, file);
    return { kind: "video", mediaId };
  }
  if (!file.type.startsWith("image/")) throw new Error("Only photos and videos are supported.");
  return { kind: "image", src: await resizeImage(file, maxSide) };
}
