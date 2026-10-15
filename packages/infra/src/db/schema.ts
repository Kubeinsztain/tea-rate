import { integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const teaTypeEnum = pgEnum("tea_type", [
  "green",
  "black",
  "oolong",
  "white",
  "puerh",
  "herbal",
]);

export const brewMethodEnum = pgEnum("brew_method", [
  "gongfu",
  "western",
  "grandpa",
  "cold",
]);

export const teas = pgTable("teas", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: teaTypeEnum("type").notNull(),
  vendor: text("vendor"),
  region: text("region"),
});

export const tastingNotes = pgTable("tasting_notes", {
  id: text("id").primaryKey(),
  teaId: text("tea_id")
    .notNull()
    .references(() => teas.id),
  rating: integer("rating").notNull(),
  notes: text("notes"),
  brewedAt: timestamp("brewed_at", { withTimezone: true }).notNull(),
  brewMethod: brewMethodEnum("brew_method"),
});
