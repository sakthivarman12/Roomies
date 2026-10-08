"use client";

import { useEffect, useState } from "react";
import { mediaStore } from "@/lib/mediaStore";

/** Resolves a displayable URL: the image data URL itself, or an object URL for a stored video blob. */
export function useMediaUrl(item: { src?: string; mediaId?: string } | null | undefined): string | null {
  const [resolved, setResolved] = useState<{ id: string; url: string } | null>(null);
  const mediaId = item?.mediaId;

  useEffect(() => {
    if (!mediaId) return;
    let revoked = false;
    let created: string | null = null;
    mediaStore.get(mediaId).then((blob) => {
      if (revoked || !blob) return;
      created = URL.createObjectURL(blob);
      setResolved({ id: mediaId, url: created });
    }).catch(() => undefined);
    return () => { revoked = true; if (created) URL.revokeObjectURL(created); };
  }, [mediaId]);

  if (!item) return null;
  if (mediaId) return resolved?.id === mediaId ? resolved.url : null;
  return item.src || null;
}
