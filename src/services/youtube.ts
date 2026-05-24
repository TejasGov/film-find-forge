import { YOUTUBE_API_KEY } from "@/lib/config";

export interface TrailerResult {
  videoId: string | null;
  fallbackUrl?: string;
}

export async function findTrailer(movieTitle: string): Promise<TrailerResult | null> {
  const searchRes = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(
      movieTitle + " official trailer"
    )}&type=video&key=${YOUTUBE_API_KEY}`
  );
  const searchData = await searchRes.json();
  if (!searchData.items?.length) return null;

  for (const item of searchData.items) {
    const videoId: string = item.id.videoId;
    const videoRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=status&id=${videoId}&key=${YOUTUBE_API_KEY}`
    );
    const videoData = await videoRes.json();
    if (videoData.items?.[0]?.status?.embeddable === true) return { videoId };
  }

  return {
    videoId: null,
    fallbackUrl: `https://www.youtube.com/watch?v=${searchData.items[0].id.videoId}`,
  };
}
