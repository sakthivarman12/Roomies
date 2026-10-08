/** Device-level notification + permission helpers (Notification API via the service worker). */

export type PermissionKey = "notifications" | "location" | "camera";
export type PermState = "granted" | "denied" | "prompt" | "unsupported";

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
}

export async function permissionState(key: PermissionKey): Promise<PermState> {
  if (key === "notifications") {
    if (!notificationsSupported()) return "unsupported";
    return Notification.permission === "default" ? "prompt" : Notification.permission;
  }
  if (key === "location" && !("geolocation" in navigator)) return "unsupported";
  if (key === "camera" && !navigator.mediaDevices?.getUserMedia) return "unsupported";
  try {
    const name = key === "location" ? "geolocation" : "camera";
    const res = await navigator.permissions.query({ name: name as PermissionName });
    return res.state;
  } catch {
    return "prompt"; // Permissions API unavailable (e.g. Safari) — assume we still need to ask.
  }
}

export async function requestPermission(key: PermissionKey): Promise<PermState> {
  try {
    if (key === "notifications") {
      if (!notificationsSupported()) return "unsupported";
      const res = await Notification.requestPermission();
      return res === "default" ? "prompt" : res;
    }
    if (key === "location") {
      await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 15000 }));
      return "granted";
    }
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return "granted";
  } catch (err) {
    if (err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")) return "denied";
    if (err && typeof err === "object" && "code" in err && (err as GeolocationPositionError).code === 1) return "denied";
    return permissionState(key);
  }
}

/** Shows a notification in the device's notification panel (works while the app is in the background). */
export async function showSystemNotification(title: string, body: string, url = "/notifications", tag?: string): Promise<boolean> {
  if (!notificationsSupported() || Notification.permission !== "granted") return false;
  const options: NotificationOptions & { renotify?: boolean; vibrate?: number[] } = {
    body, icon: "/icons/icon.svg", badge: "/icons/icon.svg", tag, data: { url }, renotify: Boolean(tag), vibrate: [80, 40, 80],
  };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) { await reg.showNotification(title, options); return true; }
    new Notification(title, options);
    return true;
  } catch {
    return false;
  }
}
