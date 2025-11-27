-- Migration: Add PDF documents and chat PDF references tables
-- Run this SQL script on your database to create the new tables

-- Create pdf_documents table
CREATE TABLE IF NOT EXISTS lightshadow_pdf_document (
    id SERIAL PRIMARY KEY,
    "userId" VARCHAR(256) NOT NULL,
    "fileName" VARCHAR(512) NOT NULL,
    "fileUrl" VARCHAR(1024) NOT NULL,
    "pdfAiFileId" VARCHAR(256),
    "uploadthingFileKey" VARCHAR(512),
    "pageCount" INTEGER,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE
);

-- Create index on userId for pdf_documents
CREATE INDEX IF NOT EXISTS pdf_user_idx ON lightshadow_pdf_document("userId");

-- Create chat_pdf_references table
CREATE TABLE IF NOT EXISTS lightshadow_chat_pdf_reference (
    id SERIAL PRIMARY KEY,
    "chatId" INTEGER NOT NULL REFERENCES lightshadow_chat(id) ON DELETE CASCADE,
    "pdfDocumentId" INTEGER NOT NULL REFERENCES lightshadow_pdf_document(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for chat_pdf_references
CREATE INDEX IF NOT EXISTS chat_pdf_chat_idx ON lightshadow_chat_pdf_reference("chatId");
CREATE INDEX IF NOT EXISTS chat_pdf_doc_idx ON lightshadow_chat_pdf_reference("pdfDocumentId");
