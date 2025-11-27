// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { index, pgTableCreator } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

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

export const userProfiles = createTable(
  "user_profile",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: d.varchar({ length: 256 }).notNull().unique(),
    username: d.varchar({ length: 100 }).notNull().unique(),
    avatarUrl: d.varchar({ length: 1024 }),
    phoneNumber: d.varchar({ length: 20 }),
    uniqueId: d.varchar({ length: 50 }).notNull().unique(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("user_profile_user_idx").on(t.userId),
    index("user_profile_username_idx").on(t.username),
    index("user_profile_unique_id_idx").on(t.uniqueId),
  ],
);

export const contacts = createTable(
  "contact",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: d.varchar({ length: 256 }).notNull(),
    contactId: d.varchar({ length: 256 }).notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
  }),
  (t) => [
    index("contact_user_idx").on(t.userId),
    index("contact_contact_idx").on(t.contactId),
    index("contact_pair_idx").on(t.userId, t.contactId),
  ],
);

export const chats = createTable(
  "chat",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: d.varchar({ length: 256 }).notNull(), // creator/owner
    name: d.varchar({ length: 256 }).notNull(),
    isGroupChat: d.boolean().notNull().default(false),
    groupName: d.varchar({ length: 256 }),
    themeColor: d.varchar({ length: 50 }), // hex color code
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("chat_user_idx").on(t.userId)],
);

export const chatParticipants = createTable(
  "chat_participant",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    chatId: d
      .integer()
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    userId: d.varchar({ length: 256 }).notNull(),
    joinedAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
  }),
  (t) => [
    index("chat_participant_chat_idx").on(t.chatId),
    index("chat_participant_user_idx").on(t.userId),
    index("chat_participant_pair_idx").on(t.chatId, t.userId),
  ],
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
    replyToMessageId: d.integer().references(() => messages.id, { onDelete: "set null" }),
    mentions: d.json().$type<string[]>(), // Array of user IDs mentioned in the message
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
  }),
  (t) => [
    index("message_chat_idx").on(t.chatId),
    index("message_reply_idx").on(t.replyToMessageId),
  ],
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

// Relations
export const userProfilesRelations = relations(userProfiles, ({ many }) => ({
  contacts: many(contacts, { relationName: "userContacts" }),
  contactOf: many(contacts, { relationName: "contactOf" }),
  chats: many(chats),
  chatParticipants: many(chatParticipants),
  pdfDocuments: many(pdfDocuments),
}));

export const contactsRelations = relations(contacts, ({ one }) => ({
  user: one(userProfiles, {
    fields: [contacts.userId],
    references: [userProfiles.userId],
    relationName: "userContacts",
  }),
  contact: one(userProfiles, {
    fields: [contacts.contactId],
    references: [userProfiles.userId],
    relationName: "contactOf",
  }),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  owner: one(userProfiles, {
    fields: [chats.userId],
    references: [userProfiles.userId],
  }),
  messages: many(messages),
  participants: many(chatParticipants),
  pdfReferences: many(chatPdfReferences),
}));

export const chatParticipantsRelations = relations(chatParticipants, ({ one }) => ({
  chat: one(chats, {
    fields: [chatParticipants.chatId],
    references: [chats.id],
  }),
  user: one(userProfiles, {
    fields: [chatParticipants.userId],
    references: [userProfiles.userId],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
}));

export const pdfDocumentsRelations = relations(pdfDocuments, ({ one, many }) => ({
  user: one(userProfiles, {
    fields: [pdfDocuments.userId],
    references: [userProfiles.userId],
  }),
  chatReferences: many(chatPdfReferences),
}));

export const chatPdfReferencesRelations = relations(chatPdfReferences, ({ one }) => ({
  chat: one(chats, {
    fields: [chatPdfReferences.chatId],
    references: [chats.id],
  }),
  pdfDocument: one(pdfDocuments, {
    fields: [chatPdfReferences.pdfDocumentId],
    references: [pdfDocuments.id],
  }),
}));
