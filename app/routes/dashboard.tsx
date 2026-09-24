import { useEffect, useState } from "react";
import { env } from "cloudflare:workers";
import { Link, useFetcher, useSubmit } from "react-router";
import { eq } from "drizzle-orm";
import { getDb } from "../db.server";
import { memes, categories } from "../../drizzle/schema";
import type { Route } from "./+types/dashboard";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function loader() {
  const db = getDb(env.bookpoint_db);
  const allCategories = await db.select().from(categories).all();
  const allMemes = await db.select().from(memes).all();

  const counts: Record<string, number> = {};
  for (const meme of allMemes) {
    if (!meme.category) continue;
    counts[meme.category] = (counts[meme.category] ?? 0) + 1;
  }

  return { categories: allCategories, counts };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const db = getDb(env.bookpoint_db);

  if (intent === "addCategory") {
    const name = formData.get("name") as string;
    const image = formData.get("image") as string;

    await db.insert(categories).values({
      name,
      slug: slugify(name),
      image: image || null,
    });

    return { ok: true };
  }

  if (intent === "updateCategory") {
    const id = Number(formData.get("id"));
    const name = formData.get("name") as string;
    const image = formData.get("image") as string;

    await db
      .update(categories)
      .set({ name, image: image || null })
      .where(eq(categories.id, id));

    return { ok: true };
  }

  if (intent === "deleteCategory") {
    const id = Number(formData.get("id"));
    await db.delete(categories).where(eq(categories.id, id));
    return { ok: true };
  }

  return null;
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const submit = useSubmit();
  const addFetcher = useFetcher();
  const editFetcher = useFetcher();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<typeof loaderData.categories[number] | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: number; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = loaderData.categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (addFetcher.state === "idle" && addFetcher.data?.ok) {
      setIsAddOpen(false);
    }
  }, [addFetcher.state, addFetcher.data]);

  useEffect(() => {
    if (editFetcher.state === "idle" && editFetcher.data?.ok) {
      setEditingCategory(null);
    }
  }, [editFetcher.state, editFetcher.data]);

  function confirmDeleteCategory() {
    if (!categoryToDelete) return;
    const formData = new FormData();
    formData.append("intent", "deleteCategory");
    formData.append("id", String(categoryToDelete.id));
    submit(formData, { method: "post" });
    setCategoryToDelete(null);
  }

  return (
    <div className="p-8 bg-ink min-h-screen">
      <div className="flex items-center justify-between mb-8 gap-4">
        <h1 className="font-serif text-4xl text-gold">MEMEPOINT</h1>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Tafuta category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-card text-gold-soft rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gold w-48"
          />
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="px-5 py-2 rounded bg-gold text-ink font-semibold hover:bg-gold-soft"
          >
            Ongeza Category
          </button>
        </div>
      </div>

      {filteredCategories.length === 0 ? (
        <p className="text-gold-soft/70">
          {loaderData.categories.length === 0
            ? "Hakuna categories bado."
            : "Hakuna category inayolingana na utafutaji wako."}
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="bg-card rounded-lg overflow-hidden border border-gold/10 hover:border-gold/40 transition relative group"
            >
              <Link to={`/category/${cat.slug}`}>
                {cat.image && (
                  <img src={cat.image} alt={cat.name} className="w-full h-40 object-cover" />
                )}
                <div className="p-4">
                  <h2 className="font-serif italic text-xl text-gold">{cat.name}</h2>
                  <p className="text-gold-soft/70 text-sm mt-1">
                    {loaderData.counts[cat.slug] ?? 0} meme
                  </p>
                </div>
              </Link>

              <button
                type="button"
                title="Hariri category"
                onClick={() => setEditingCategory(cat)}
                className="absolute top-2 right-2 bg-ink/80 rounded-full p-2 text-gold hover:text-gold-soft"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                </svg>
              </button>

              <button
                type="button"
                title="Futa category"
                onClick={() => setCategoryToDelete({ id: cat.id, name: cat.name })}
                className="absolute top-2 right-11 bg-ink/80 rounded-full p-2 text-red-400 hover:text-red-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg p-6 max-w-md w-full border border-gold/20">
            <h2 className="font-serif text-xl text-gold mb-4">Ongeza Category</h2>
            <addFetcher.Form method="post" className="space-y-3">
              <input type="hidden" name="intent" value="addCategory" />
              <div>
                <label className="block text-gold-soft mb-1 text-sm">Jina la category</label>
                <input name="name" required className="w-full bg-ink text-gold-soft rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gold" />
              </div>
              <div>
                <label className="block text-gold-soft mb-1 text-sm">URL ya picha</label>
                <input name="image" type="url" placeholder="https://..." className="w-full bg-ink text-gold-soft rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gold" />
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

      {editingCategory && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg p-6 max-w-md w-full border border-gold/20">
            <h2 className="font-serif text-xl text-gold mb-4">Hariri Category</h2>
            <editFetcher.Form method="post" className="space-y-3">
              <input type="hidden" name="intent" value="updateCategory" />
              <input type="hidden" name="id" value={editingCategory.id} />
              <div>
                <label className="block text-gold-soft mb-1 text-sm">Jina la category</label>
                <input
                  name="name"
                  required
                  defaultValue={editingCategory.name}
                  className="w-full bg-ink text-gold-soft rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
              <div>
                <label className="block text-gold-soft mb-1 text-sm">URL ya picha</label>
                <input
                  name="image"
                  type="url"
                  defaultValue={editingCategory.image ?? ""}
                  className="w-full bg-ink text-gold-soft rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditingCategory(null)} className="px-4 py-2 rounded text-gold-soft hover:bg-ink">
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

      {categoryToDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg p-6 max-w-sm w-full border border-gold/20">
            <h2 className="font-serif text-xl text-gold mb-3">Futa Category</h2>
            <p className="text-gold-soft mb-6">
              Una uhakika unataka kufuta "{categoryToDelete.name}"? Memes zilizomo hazitafutwa, lakini hazitaonekana kwenye category yoyote mpaka uzibadilishie category nyingine.
            </p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setCategoryToDelete(null)} className="px-4 py-2 rounded text-gold-soft hover:bg-ink">
                Ghairi
              </button>
              <button type="button" onClick={confirmDeleteCategory} className="px-4 py-2 rounded bg-red-900 text-red-100 hover:bg-red-800">
                Futa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}