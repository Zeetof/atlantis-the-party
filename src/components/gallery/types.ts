export type GalleryItem = {
  id: string;
  type: "IMAGE" | "VIDEO";
  src: string;
  poster: string | null;
  caption: string;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  editionSlug: string;
  editionName: string;
};

export function formatDuration(seconds: number | null) {
  if (!seconds) return null;
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}
