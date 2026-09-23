import { env } from "cloudflare:workers";
import { getDb } from "../db.server";
import { books } from "../../drizzle/schema";
import type { Route } from "./+types/home";

export async function loader() {
  const db = getDb(env.bookpoint_db);
  const allBooks = await db.select().from(books).all();
  return { books: allBooks };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <div className="p-8 bg-ink min-h-screen">
      <h1 className="font-serif text-4xl text-gold mb-6">BOOKPOINT</h1>
         <a
        href="/new-book"
        className=" absolute top-4 right-4 inline-block mt-6 px-5 py-2 rounded bg-gold text-ink font-semibold hover:bg-gold-soft"
      >
        Ongeza Kitabu
      </a>
      <ul className="space-y-3 ">
        {loaderData.books.map((book) => (
          <li
            key={book.id}
            className="bg-card border border-gold-soft/30 rounded-lg px-4 py-3 text-gold-soft"
          >
            <span className="font-serif text-lg">{book.title}</span>
            <span className="text-gold-soft/70"> — {book.author} {book.year ? `(${book.year})` : ""}</span>
          </li>
        ))}
      </ul>
      
   
    </div>
  );
}