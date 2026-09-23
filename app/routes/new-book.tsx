import { env } from "cloudflare:workers";
import { redirect } from "react-router";
import { getDb } from "../db.server";
import { books } from "../../drizzle/schema";
import type { Route } from "./+types/new-book";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const title = formData.get("title") as string;
  const author = formData.get("author") as string;
  const yearRaw = formData.get("year") as string;

  const db = getDb(env.bookpoint_db);
  await db.insert(books).values({
    title,
    author,
    year: yearRaw ? Number(yearRaw) : null,
  });

  return redirect("/");
}

export default function NewBook() {

  return (
    <div className="p-8 bg-ink min-h-screen">
      <h1 className="font-serif text-3xl text-gold mb-6">Ongeza Kitabu</h1>
      <form method="post" className="space-y-4 max-w-md">
        <div>
          <label className="block text-gold-soft mb-1">Jina la kitabu</label>
          <input
            name="title"
            required
            className="w-full bg-card text-gold-soft rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gold"
          />
        </div>
        <div>
          <label className="block text-gold-soft mb-1">Mwandishi</label>
          <input
            name="author"
            required
            className="w-full bg-card text-gold-soft rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gold"
          />
        </div>
        <div>
          <label className="block text-gold-soft mb-1">Mwaka</label>
          <input
            name="year"
            type="number"
            className="w-full bg-card text-gold-soft rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gold"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2 rounded bg-gold text-ink font-semibold hover:bg-gold-soft"
        >
          Hifadhi
        </button>
      </form>
    </div>
  );
}
