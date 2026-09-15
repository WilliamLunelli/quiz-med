/**
 * Lê uma imagem escolhida pelo usuário, reduz e comprime no próprio navegador,
 * e devolve um data URI pequeno (JPEG). Assim a foto de capa vai leve para a
 * API e para o banco, sem depender de storage externo.
 *
 * Uma foto de celular (2–5 MB) costuma cair para ~100–250 KB.
 */
export async function fileToCompressedDataUrl(
  file: File,
  maxDim = 900,
  quality = 0.72,
): Promise<string> {
  const original = await readAsDataUrl(file);
  const img = await loadImage(original);

  let { width, height } = img;
  if (width > maxDim || height > maxDim) {
    const scale = Math.min(maxDim / width, maxDim / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return original;
  ctx.drawImage(img, 0, 0, width, height);

  let out = canvas.toDataURL('image/jpeg', quality);
  // Rede de segurança: se ainda ficou grande, aperta mais uma vez.
  if (out.length > 900 * 1024) {
    out = canvas.toDataURL('image/jpeg', 0.55);
  }
  return out;
}

/** Tamanho aproximado em KB de um data URI (para mostrar ao usuário). */
export function dataUrlSizeKb(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  return Math.round((b64.length * 3) / 4 / 1024);
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
    fr.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Arquivo não é uma imagem válida.'));
    img.src = src;
  });
}
