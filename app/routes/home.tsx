import { useEffect, useState } from "react";
import { env } from "cloudflare:workers";
import { Link, useSubmit, useFetcher } from "react-router";
import type { Route } from "./+types/home";
import { getDb } from "../db.server";
import { books } from "../../drizzle/schema";

export async function loader() {
  const db = getDb(env.bookpoint_db);
  const allBooks = await db.select().from(books).all();
  return { books: allBooks };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const title = formData.get("title") as string;
  const author = formData.get("author") as string;
  const yearRaw = formData.get("year") as string;
  const description = formData.get("description") as string;
  const image = formData.get("image") as string;

  const db = getDb(env.bookpoint_db);
  await db.insert(books).values({
    title,
    author,
    year: yearRaw ? Number(yearRaw) : null,
    description: description || null,
    image: image || null,
  });

  return { ok: true };
}
function capitalizeFirstLetter(e: React.FocusEvent<HTMLInputElement>) {
  const el = e.target;
  if (el.value.length > 0) {
    el.value = el.value.charAt(0).toUpperCase() + el.value.slice(1);
  }
}
export default function Home({ loaderData }: Route.ComponentProps) {
  const submit = useSubmit();
  const fetcher = useFetcher();
  const editFetcher = useFetcher();

  const [bookToDelete, setBookToDelete] = useState<{ id: number; title: string } | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<typeof loaderData.books[number] | null>(null);

  function confirmDelete() {
    if (!bookToDelete) return;
    const formData = new FormData();
    formData.append("intent", "delete");
    submit(formData, { method: "post", action: `/books/${bookToDelete.id}` });
    setBookToDelete(null);
  }

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.ok) {
      setIsAddOpen(false);
    }
  }, [fetcher.state, fetcher.data]);

  useEffect(() => {
    if (editFetcher.state === "idle" && editFetcher.data?.ok) {
      setEditingBook(null);
    }
  }, [editFetcher.state, editFetcher.data]);

  return (
    <div className="p-8 bg-ink min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-4xl text-gold">BOOKPOINT</h1>
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="px-5 py-2 rounded bg-gold text-ink font-semibold hover:bg-gold-soft"
        >
          Ongeza Kitabu
        </button>
      </div>

      <ul className="space-y-3">
        {loaderData.books.map((book) => (
          <li
            key={book.id}
            className="bg-card rounded-lg px-4 py-3 flex items-center justify-between"
          >
            <div>
           <span className="font-serif italic text-lg text-gold-soft">{book.title}</span>
              <span className="text-gold-soft/70">
                {" "}
                — {book.author} {book.year ? `(${book.year})` : ""}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to={`/books/${book.id}`}
                title="Angalia kitabu"
                className="text-gold hover:text-gold-soft"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </Link>

              <button
                type="button"
                title="Hariri kitabu"
                onClick={() => setEditingBook(book)}
                className="text-gold hover:text-gold-soft"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                </svg>
              </button>

              <button
                type="button"
                title="Futa kitabu"
                onClick={() => setBookToDelete({ id: book.id, title: book.title })}
                className="text-red-400 hover:text-red-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                </svg>
              </button>
            </div>
          </li>
        ))}
      </ul>

      {bookToDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg p-6 max-w-sm w-full border border-gold/20">
            <h2 className="font-serif text-xl text-gold mb-3">Futa Kitabu</h2>
            <p className="text-gold-soft mb-6">
              Una uhakika unataka kufuta "{bookToDelete.title}"?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setBookToDelete(null)}
                className="px-4 py-2 rounded text-gold-soft hover:bg-ink"
              >
                Ghairi
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded bg-red-900 text-red-100 hover:bg-red-800"
              >
                Futa
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg p-6 max-w-md w-full border border-gold/20">
            <h2 className="font-serif text-xl text-gold mb-4">Ongeza Kitabu</h2>
            <fetcher.Form method="post" className="space-y-3">
              <div>
                <label className="block text-gold-soft mb-1 text-sm">Jina la kitabu</label>
               <input
  name="title"
  required
  onBlur={capitalizeFirstLetter}
  className="w-full bg-ink text-gold-soft rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gold"
/>
              </div>
              <div>
                <label className="block text-gold-soft mb-1 text-sm">Mwandishi</label>
               <input
  name="author"
  required
  onBlur={capitalizeFirstLetter}
  className="w-full bg-ink text-gold-soft rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gold"
/>
              </div>
              <div>
                <label className="block text-gold-soft mb-1 text-sm">Mwaka</label>
                <input name="year" type="number" className="w-full bg-ink text-gold-soft rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gold" />
              </div>
              <div>
                <label className="block text-gold-soft mb-1 text-sm">URL ya picha</label>
                <input name="image" type="url" placeholder="https://..." className="w-full bg-ink text-gold-soft rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gold" />
              </div>
              <div>
                <label className="block text-gold-soft mb-1 text-sm">Maelezo</label>
                <textarea name="description" rows={3} className="w-full bg-ink text-gold-soft rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gold" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 rounded text-gold-soft hover:bg-ink">
                  Ghairi
                </button>
                <button
                  type="submit"
                  disabled={fetcher.state !== "idle"}
                  className="px-4 py-2 rounded bg-gold text-ink font-semibold hover:bg-gold-soft disabled:opacity-60"
                >
                  {fetcher.state !== "idle" ? "Inahifadhi..." : "Hifadhi"}
                </button>
              </div>
            </fetcher.Form>
          </div>
        </div>
      )}

      {editingBook && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg p-6 max-w-md w-full border border-gold/20">
            <h2 className="font-serif text-xl text-gold mb-4">Hariri Kitabu</h2>
            <editFetcher.Form
              method="post"
              action={`/books/${editingBook.id}`}
              className="space-y-3"
            >
              <input type="hidden" name="intent" value="update" />
              <div>
                <label className="block text-gold-soft mb-1 text-sm">Jina la kitabu</label>
                <input
                  name="title"
                  required
                  defaultValue={editingBook.title}
                  className="w-full bg-ink text-gold-soft rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
              <div>
                <label className="block text-gold-soft mb-1 text-sm">Mwandishi</label>
                <input
                  name="author"
                  required
                  defaultValue={editingBook.author}
                  className="w-full bg-ink text-gold-soft rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
              <div>
                <label className="block text-gold-soft mb-1 text-sm">Mwaka</label>
                <input
                  name="year"
                  type="number"
                  defaultValue={editingBook.year ?? ""}
                  className="w-full bg-ink text-gold-soft rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
              <div>
                <label className="block text-gold-soft mb-1 text-sm">URL ya picha</label>
                <input
                  name="image"
                  type="url"
                  defaultValue={editingBook.image ?? ""}
                  className="w-full bg-ink text-gold-soft rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
              <div>
                <label className="block text-gold-soft mb-1 text-sm">Maelezo</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingBook.description ?? ""}
                  className="w-full bg-ink text-gold-soft rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBook(null)}
                  className="px-4 py-2 rounded text-gold-soft hover:bg-ink"
                >
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