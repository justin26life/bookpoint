import { useEffect, useState } from "react";
import { env } from "cloudflare:workers";
import { Link, useSubmit, useFetcher } from "react-router";
import { eq } from "drizzle-orm";
import { getDb } from "../db.server";
import { memes, categories } from "../../drizzle/schema";
import type { Route } from "./+types/category";

export async function loader({ params }: Route.LoaderArgs) {
  const db = getDb(env.bookpoint_db);
  const category = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, params.slug))
    .get();

  if (!category) {
    throw new Response("Category haipatikani", { status: 404 });
  }

  const categoryMemes = await db
    .select()
    .from(memes)
    .where(eq(memes.category, params.slug))
    .all();

  const allCategories = await db.select().from(categories).all();

  return { category, memes: categoryMemes, allCategories };
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const db = getDb(env.bookpoint_db);

  if (intent === "addMeme") {
    const caption = formData.get("caption") as string;
    const image = formData.get("image") as string;
    const mediaType = formData.get("mediaType") as string;
    const soundUrl = formData.get("soundUrl") as string;

    await db.insert(memes).values({
      caption,
      image,
      mediaType: mediaType || "image",
      soundUrl: soundUrl || null,
      category: params.slug,
    });

    return { ok: true };
  }

  if (intent === "updateMeme") {
    const id = Number(formData.get("id"));
    const caption = formData.get("caption") as string;
    const image = formData.get("image") as string;
    const mediaType = formData.get("mediaType") as string;
    const soundUrl = formData.get("soundUrl") as string;
    const category = formData.get("category") as string;

    await db
      .update(memes)
      .set({
        caption,
        image,
        mediaType: mediaType || "image",
        soundUrl: soundUrl || null,
        category,
      })
      .where(eq(memes.id, id));

    return { ok: true };
  }

  if (intent === "deleteMeme") {
    const id = Number(formData.get("id"));
    await db.delete(memes).where(eq(memes.id, id));
    return { ok: true };
  }

  return null;
}

export default function CategoryPage({ loaderData }: Route.ComponentProps) {
  const submit = useSubmit();
  const addFetcher = useFetcher();
  const editFetcher = useFetcher();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingMeme, setEditingMeme] = useState<typeof loaderData.memes[number] | null>(null);
  const [memeToDelete, setMemeToDelete] = useState<{ id: number; caption: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMemes = loaderData.memes.filter((meme) =>
    meme.caption.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (addFetcher.state === "idle" && addFetcher.data?.ok) {
      setIsAddOpen(false);
    }
  }, [addFetcher.state, addFetcher.data]);

  useEffect(() => {
    if (editFetcher.state === "idle" && editFetcher.data?.ok) {
      setEditingMeme(null);
    }
  }, [editFetcher.state, editFetcher.data]);

  function confirmDelete() {
    if (!memeToDelete) return;
    const formData = new FormData();
    formData.append("intent", "deleteMeme");
    formData.append("id", String(memeToDelete.id));
    submit(formData, { method: "post" });
    setMemeToDelete(null);
  }

  return (
    <div className="p-8 bg-ink min-h-screen">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <Link to="/" className="text-gold-soft/70 hover:text-gold text-sm">
            ← Dashboard
          </Link>
          <h1 className="font-serif text-4xl text-gold mt-1">{loaderData.category.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Tafuta meme..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-card text-gold-soft rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gold w-48"
          />
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="px-5 py-2 rounded bg-gold text-ink font-semibold hover:bg-gold-soft"
          >
            Ongeza Meme
          </button>
        </div>
      </div>

      {filteredMemes.length === 0 ? (
        <p className="text-gold-soft/70">
          {loaderData.memes.length === 0
            ? "Hakuna memes bado kwenye category hii."
            : "Hakuna meme inayolingana na utafutaji wako."}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMemes.map((meme) => (
            <div key={meme.id} className="bg-card rounded-lg overflow-hidden border border-gold/10">
              <Link to={`/memes/${meme.id}`}>
                {meme.mediaType === "video" ? (
                  <video
                    src={meme.image}
                    className="w-full h-52 object-cover"
                    muted
                    playsInline
                  />
                ) : (
                  <img src={meme.image} alt={meme.caption} className="w-full h-52 object-cover" />
                )}
              </Link>
              <div className="p-4">
                <Link to={`/memes/${meme.id}`}>
                  <p className="text-gold-soft hover:text-gold text-sm line-clamp-2">{meme.caption}</p>
                </Link>
                <div className="flex items-center gap-3 mt-3">
                  <button
                    type="button"
                    title="Hariri meme"
                    onClick={() => setEditingMeme(meme)}
                    className="text-gold hover:text-gold-soft"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    title="Futa meme"
                    onClick={() => setMemeToDelete({ id: meme.id, caption: meme.caption })}
                    className="text-red-400 hover:text-red-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {memeToDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg p-6 max-w-sm w-full border border-gold/20">
            <h2 className="font-serif text-xl text-gold mb-3">Futa Meme</h2>
            <p className="text-gold-soft mb-6">
              Una uhakika unataka kufuta meme hii?
            </p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setMemeToDelete(null)} className="px-4 py-2 rounded text-gold-soft hover:bg-ink">
                Ghairi
              </button>
              <button type="button" onClick={confirmDelete} className="px-4 py-2 rounded bg-red-900 text-red-100 hover:bg-red-800">
                Futa
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg p-6 max-w-md w-full border border-gold/20">
            <h2 className="font-serif text-xl text-gold mb-4">Ongeza Meme — {loaderData.category.name}</h2>
            <addFetcher.Form method="post" className="space-y-3">
              <input type="hidden" name="intent" value="addMeme" />
              <div>
                <label className="block text-gold-soft mb-1 text-sm">Aina</label>
                <select name="mediaType" required defaultValue="image" className="w-full bg-ink text-gold-soft rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gold">
                  <option value="image">Picha</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <div>
                <label className="block text-gold-soft mb-1 text-sm">URL ya picha/video</label>
                <input name="image" type="url" required placeholder="https://..." className="w-full bg-ink text-gold-soft rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gold" />
              </div>
              <div>
                <label className="block text-gold-soft mb-1 text-sm">Caption</label>
                <textarea name="caption" required rows={2} className="w-full bg-ink text-gold-soft rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gold" />
              </div>
              <div>
                <label className="block text-gold-soft mb-1 text-sm">URL ya sauti (hiari, kwa picha)</label>
                <input name="soundUrl" type="url" placeholder="https://..." className="w-full bg-ink text-gold-soft rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gold" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 rounded text-gold-soft hover:bg-ink">
                  Ghairi
                </button>
                <button
                  type="submit"
                  disabled={addFetcher.state !== "idle"}
                  className="px-4 py-2 rounded bg-gold text-ink font-semibold hover:bg-gold-soft disabled:opacity-60"
                >
                  {addFetcher.state !== "idle" ? "Inahifadhi..." : "Hifadhi"}
                </button>
              </div>
            </addFetcher.Form>
          </div>
        </div>
      )}

      {editingMeme && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg p-6 max-w-md w-full border border-gold/20">
            <h2 className="font-serif text-xl text-gold mb-4">Hariri Meme</h2>
            <editFetcher.Form method="post" className="space-y-3">
              <input type="hidden" name="intent" value="updateMeme" />
              <input type="hidden" name="id" value={editingMeme.id} />
              <div>
                <label className="block text-gold-soft mb-1 text-sm">Aina</label>
                <select name="mediaType" required defaultValue={editingMeme.mediaType ?? "image"} className="w-full bg-ink text-gold-soft rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gold">
                  <option value="image">Picha</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <div>
                <label className="block text-gold-soft mb-1 text-sm">URL ya picha/video</label>
                <input name="image" type="url" required defaultValue={editingMeme.image} className="w-full bg-ink text-gold-soft rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gold" />
              </div>
              <div>
                <label className="block text-gold-soft mb-1 text-sm">Caption</label>
                <textarea name="caption" required rows={2} defaultValue={editingMeme.caption} className="w-full bg-ink text-gold-soft rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gold" />
              </div>
              <div>
                <label className="block text-gold-soft mb-1 text-sm">Category</label>
                <select name="category" required defaultValue={editingMeme.category ?? loaderData.category.slug} className="w-full bg-ink text-gold-soft rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gold">
                  {loaderData.allCategories.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gold-soft mb-1 text-sm">URL ya sauti (hiari, kwa picha)</label>
                <input name="soundUrl" type="url" defaultValue={editingMeme.soundUrl ?? ""} className="w-full bg-ink text-gold-soft rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gold" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditingMeme(null)} className="px-4 py-2 rounded text-gold-soft hover:bg-ink">
                  Ghairi
                </button>
                <button
                  type="submit"
                  disabled={editFetcher.state !== "idle"}
                  className="px-4 py-2 rounded bg-gold text-ink font-semibold hover:bg-gold-soft disabled:opacity-60"
                >
                  {editFetcher.state !== "idle" ? "Inahifadhi..." : "Hifadhi Mabadiliko"}
                </button>
              </div>
            </editFetcher.Form>
          </div>
        </div>
      )}
    </div>
  );
}