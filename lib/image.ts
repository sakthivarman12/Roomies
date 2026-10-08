/** Reads an image file and returns a downscaled JPEG data URL (keeps localStorage small). */
export async function resizeImage(file: File, maxSide = 1000, quality = 0.72): Promise<string> {
  const raw = await new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(new Error("Couldn't read that image."));
    r.readAsDataURL(file);
  });
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      res(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => res(raw);
    img.src = raw;
  });
}
