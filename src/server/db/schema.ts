// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { index, pgTableCreator } from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `lightshadow_${name}`);

export const posts = createTable(
  "post",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("name_idx").on(t.name)],
);

export const chats = createTable(
  "chat",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: d.varchar({ length: 256 }).notNull(),
    name: d.varchar({ length: 256 }).notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("chat_user_idx").on(t.userId)],
);

export const messages = createTable(
  "message",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    chatId: d
      .integer()
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    role: d.varchar({ length: 32 }).notNull(), // 'user' or 'assistant'
    content: d.text().notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
  }),
  (t) => [index("message_chat_idx").on(t.chatId)],
);

export const pdfDocuments = createTable(
  "pdf_document",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: d.varchar({ length: 256 }).notNull(),
    fileName: d.varchar({ length: 512 }).notNull(),
    fileUrl: d.varchar({ length: 1024 }).notNull(),
    pdfAiFileId: d.varchar({ length: 256 }), // PDF.ai file ID
    uploadthingFileKey: d.varchar({ length: 512 }), // UploadThing file key
    pageCount: d.integer(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("pdf_user_idx").on(t.userId)],
);

export const chatPdfReferences = createTable(
  "chat_pdf_reference",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    chatId: d
      .integer()
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    pdfDocumentId: d
      .integer()
      .notNull()
      .references(() => pdfDocuments.id, { onDelete: "cascade" }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
  }),
  (t) => [
    index("chat_pdf_chat_idx").on(t.chatId),
    index("chat_pdf_doc_idx").on(t.pdfDocumentId),
  ],
);
