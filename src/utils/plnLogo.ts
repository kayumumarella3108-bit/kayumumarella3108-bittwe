export const PLN_LOGO_BASE64 = 'data:image/svg+xml;base64,' + btoa(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 180" width="200" height="180">
  <rect width="200" height="180" rx="14" fill="#FFEB3B" />
  <path d="M 30,55 Q 65,40 100,55 T 170,55" fill="none" stroke="#00BCD4" stroke-width="12" stroke-linecap="round" />
  <path d="M 30,90 Q 65,75 100,90 T 170,90" fill="none" stroke="#00BCD4" stroke-width="12" stroke-linecap="round" />
  <path d="M 30,125 Q 65,110 100,125 T 170,125" fill="none" stroke="#00BCD4" stroke-width="12" stroke-linecap="round" />
  <polygon points="120,15 70,100 108,100 80,165 145,78 107,78" fill="#E53935" />
</svg>
`.trim());

export async function getPlnLogoPng(): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      } else {
        resolve(PLN_LOGO_BASE64);
      }
    };
    img.onerror = () => resolve(PLN_LOGO_BASE64);
    img.src = PLN_LOGO_BASE64;
  });
}

