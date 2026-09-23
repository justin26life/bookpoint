import { env } from "cloudflare:workers";
import { redirect, Link } from "react-router";
import { eq } from "drizzle-orm";
import { getDb } from "../db.server";
import { books } from "../../drizzle/schema";
import type { Route } from "./+types/book";

export async function loader({ params }: Route.LoaderArgs) {
  const db = getDb(env.bookpoint_db);
  const book = await db
    .select()
    .from(books)
    .where(eq(books.id, Number(params.id)))
    .get();

  if (!book) {
    throw new Response("Kitabu hakipatikani", { status: 404 });
  }

  return { book };
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const db = getDb(env.bookpoint_db);
  const id = Number(params.id);

  if (intent === "delete") {
    await db.delete(books).where(eq(books.id, id));
    return redirect("/");
  }

  if (intent === "update") {
    const title = formData.get("title") as string;
    const author = formData.get("author") as string;
    const yearRaw = formData.get("year") as string;
    const description = formData.get("description") as string;
    const image = formData.get("image") as string;

    await db
      .update(books)
      .set({
        title,
        author,
        year: yearRaw ? Number(yearRaw) : null,
        description: description || null,
        image: image || null,
      })
      .where(eq(books.id, id));

    return { ok: true };
  }

  return null;
}

export default function BookDetail({ loaderData }: Route.ComponentProps) {
  const { book } = loaderData;

  return (
    <div className="p-8 bg-ink min-h-screen">
      <Link to="/" className="text-gold-soft/70 hover:text-gold">
        ← Rudi
      </Link>

      <div className="mt-4 max-w-2xl">
        {book.image && (
          <img
            src={book.image}
            alt={book.title}
            className="w-full max-w-xs rounded-lg mb-6 object-cover"
          />
        )}

      <h1 className="font-serif italic text-4xl text-gold mb-2">{book.title}</h1>
        <p className="text-gold-soft/70 mb-4">
          {book.author} {book.year ? `— ${book.year}` : ""}
        </p>

        {book.description && (
          <p className="text-gold-soft leading-relaxed">{book.description}</p>
        )}

        <form method="post" className="mt-6">
          <button
            type="submit"
            className="px-4 py-2 rounded bg-red-900 text-red-100 hover:bg-red-800"
          >
            Futa Kitabu
          </button>
        </form>
      </div>
    </div>
  );
}