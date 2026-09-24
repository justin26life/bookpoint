import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  image: text("image"),
});

export const memes = sqliteTable("memes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  caption: text("caption").notNull(),
  image: text("image").notNull(),
  soundUrl: text("sound_url"),
  category: text("category"),
});