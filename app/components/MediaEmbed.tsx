interface MediaEmbedProps {
  url: string;
  type: string;
  caption?: string;
}

export default function MediaEmbed({
  url,
  type,
  caption = "Media",
}: MediaEmbedProps) {
  // IMAGE
  if (type === "image") {
    return (
      <img
        src={url}
        alt={caption}
        className="w-full rounded-lg object-cover"
      />
    );
  }

  // YOUTUBE
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    let videoId = "";

    if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
    }

    if (url.includes("youtube.com/watch")) {
      videoId = new URL(url).searchParams.get("v") || "";
    }

    if (url.includes("youtube.com/embed/")) {
      videoId = url.split("youtube.com/embed/")[1]?.split("?")[0] || "";
    }

    if (videoId) {
      return (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title={caption}
          className="w-full aspect-video rounded-lg"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }
  }

  // INSTAGRAM
  if (url.includes("instagram.com")) {
    const cleanUrl = url.split("?")[0].replace(/\/$/, "");

    if (cleanUrl.includes("/reel/")) {
      const reelId = cleanUrl.split("/reel/")[1]?.split("/")[0];

      if (reelId) {
        return (
          <iframe
            src={`https://www.instagram.com/reel/${reelId}/embed`}
            title={caption}
            className="w-full rounded-lg"
            style={{
              minHeight: "600px",
              border: "none",
            }}
            allowFullScreen
          />
        );
      }
    }

    if (cleanUrl.includes("/p/")) {
      const postId = cleanUrl.split("/p/")[1]?.split("/")[0];

      if (postId) {
        return (
          <iframe
            src={`https://www.instagram.com/p/${postId}/embed`}
            title={caption}
            className="w-full rounded-lg"
            style={{
              minHeight: "600px",
              border: "none",
            }}
            allowFullScreen
          />
        );
      }
    }
  }

  // TIKTOK
  if (url.includes("tiktok.com")) {
    return (
      <iframe
        src={url}
        title={caption}
        className="w-full rounded-lg"
        style={{
          minHeight: "700px",
          border: "none",
        }}
        allowFullScreen
      />
    );
  }

  // DIRECT VIDEO (.mp4, .webm, etc.)
  if (
    url.includes(".mp4") ||
    url.includes(".webm") ||
    url.includes(".ogg")
  ) {
    return (
      <video
        src={url}
        controls
        className="w-full rounded-lg"
      />
    );
  }

  // FALLBACK
  return (
    <div className="p-4 rounded-lg bg-gray-800 text-white text-center">
      <p className="mb-3">
        Video haiwezi kuonyeshwa hapa.
      </p>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gold underline"
      >
        Fungua video
      </a>
    </div>
  );
}