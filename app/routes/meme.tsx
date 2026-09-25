import { env } from "cloudflare:workers";
import { Link } from "react-router";
import { eq } from "drizzle-orm";
import { getDb } from "../db.server";
import { memes } from "../../drizzle/schema";
import type { Route } from "./+types/meme";
import MediaEmbed from "../components/MediaEmbed";

export async function loader({ params }: Route.LoaderArgs) {
  const db = getDb(env.bookpoint_db);

  const meme = await db
    .select()
    .from(memes)
    .where(eq(memes.id, Number(params.id)))
    .get();

  if (!meme) {
    throw new Response("Meme haipatikani", { status: 404 });
  }

  return { meme };
}

export default function MemeDetail({
  loaderData,
}: Route.ComponentProps) {
  const { meme } = loaderData;

  return (
    <div className="p-8 bg-ink min-h-screen flex flex-col items-center">
      <div className="w-full max-w-lg">

        <Link
          to={`/category/${meme.category}`}
          className="text-gold-soft/70 hover:text-gold"
        >
          ← Rudi
        </Link>

        <div className="mt-4 mb-4">
          <MediaEmbed
            url={meme.image}
            type={meme.mediaType}
            caption={meme.caption}
          />
        </div>

        <p className="font-serif italic text-xl text-gold-soft text-center mb-4">
          {meme.caption}
        </p>

        {meme.soundUrl && (
          <audio controls className="w-full">
            <source src={meme.soundUrl} />
          </audio>
        )}

      </div>
    </div>
  );
}