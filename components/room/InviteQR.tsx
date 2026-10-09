"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

/** Shows a scannable QR that opens the join page with the invite code pre-filled. */
export function InviteQR({ code, size = 180 }: { code: string; size?: number }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    const link = `${window.location.origin}/household?code=${encodeURIComponent(code)}`;
    QRCode.toDataURL(link, { width: size * 2, margin: 1, color: { dark: "#1e1b4b", light: "#ffffff" } })
      .then(setSrc)
      .catch(() => setSrc(""));
  }, [code, size]);

  if (!src) return <div style={{ width: size, height: size }} className="rounded-2xl bg-surface2" aria-hidden />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} width={size} height={size} alt={`QR code for invite ${code}`} className="rounded-2xl bg-white p-2" />;
}
