export function getGoogleDrivePreview(url: string): string | null {
  if (!url || !url.includes("drive.google.com")) return null;
  const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch) return `https://drive.google.com/thumbnail?id=${fileIdMatch[1]}&sz=w400`;
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w400`;
  return null;
}

export function getFigmaPreview(url: string): string | null {
  if (!url || !url.includes("figma.com")) return null;
  return `https://www.figma.com/embed?embed_host=node&url=${encodeURIComponent(url)}`;
}
