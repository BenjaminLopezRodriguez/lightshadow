import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { env } from "@/env";
import { db } from "@/server/db";
import { pdfDocuments } from "@/server/db/schema";
import { storePdfChunks, chunkText } from "@/lib/pinecone";
import { parsePDFFromURL } from "@/lib/pdf-parser";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
    // Avatar uploader
    avatarUploader: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
        .middleware(async ({ req }) => {
            const { getUser } = getKindeServerSession();
            const user = await getUser();

            if (!user) throw new Error("Unauthorized");

            return { userId: user.id };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Avatar upload complete for userId:", metadata.userId);
            return {
                uploadedBy: metadata.userId,
                url: file.url,
            };
        }),

    // Define as many FileRoutes as you like, each with a unique routeSlug
    pdfUploader: f({ pdf: { maxFileSize: "4MB", maxFileCount: 1 } })
        // Set permissions and file types for this FileRoute
        .middleware(async ({ req }) => {
            // This code runs on your server before upload
            const { getUser } = getKindeServerSession();
            const user = await getUser();

            // If you throw, the user will not be able to upload
            if (!user) throw new Error("Unauthorized");

            // Whatever is returned here is accessible in onUploadComplete as `metadata`
            return { userId: user.id };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            // This code RUNS ON YOUR SERVER after upload
            console.log("Upload complete for userId:", metadata.userId);
            console.log("file url", file.url);

            try {
                // Step 1: Upload PDF to PDF.ai
                let pdfAiFileId: string | null = null;
                try {
                    const pdfAiUploadResponse = await fetch("https://api.pdf.ai/v1/files/upload", {
                        method: "POST",
                        headers: {
                            "X-API-Key": env.PDFAI_API_KEY,
                        },
                        body: JSON.stringify({
                            url: file.url,
                        }),
                    });

                    if (pdfAiUploadResponse.ok) {
                        const pdfAiData = await pdfAiUploadResponse.json();
                        pdfAiFileId = pdfAiData.fileId || pdfAiData.id;
                        console.log("PDF.ai file ID:", pdfAiFileId);
                    } else {
                        console.error("Failed to upload to PDF.ai:", await pdfAiUploadResponse.text());
                    }
                } catch (error) {
                    console.error("Error uploading to PDF.ai:", error);
                }

                // Step 2: Extract text from PDF
                let pdfText = "";
                let pageCount = 0;
                
                // Try to get text from PDF.ai first (more reliable)
                if (pdfAiFileId) {
                    try {
                        const pdfAiTextResponse = await fetch(`https://api.pdf.ai/v1/files/${pdfAiFileId}/text`, {
                            method: "GET",
                            headers: {
                                "X-API-Key": env.PDFAI_API_KEY,
                            },
                        });
                        
                        if (pdfAiTextResponse.ok) {
                            const textData = await pdfAiTextResponse.json();
                            pdfText = textData.text || textData.content || "";
                            pageCount = textData.pageCount || textData.pages || 0;
                            console.log(`Got PDF text from PDF.ai: ${pdfText.length} characters, ${pageCount} pages`);
                        }
                    } catch (error) {
                        console.error("Error getting text from PDF.ai:", error);
                    }
                }
                
                // Fallback: Parse PDF locally using pdfjs-dist if PDF.ai didn't work
                if (!pdfText || pdfText.trim().length === 0) {
                    try {
                        console.log("PDF.ai text extraction failed or unavailable, parsing PDF locally...");
                        const parsedPDF = await parsePDFFromURL(file.url);
                        pdfText = parsedPDF.text;
                        pageCount = parsedPDF.pageCount;
                        console.log(`Parsed PDF locally: ${pdfText.length} characters, ${pageCount} pages`);
                    } catch (parseError) {
                        console.error("Error parsing PDF locally:", parseError);
                        // Continue without text - PDF.ai can still handle queries
                        console.warn("Both PDF.ai and local parsing failed. PDF will be stored but embeddings won't be created.");
                    }
                }

                // Step 3: Store PDF metadata in database
                const [pdfDoc] = await db
                    .insert(pdfDocuments)
                    .values({
                        userId: metadata.userId,
                        fileName: file.name,
                        fileUrl: file.url,
                        pdfAiFileId: pdfAiFileId || undefined,
                        uploadthingFileKey: file.key,
                        pageCount: pageCount || undefined,
                    })
                    .returning();

                // Step 4: Chunk PDF text and store in Pinecone (only if we have text)
                if (pdfDoc) {
                    if (pdfText && pdfText.trim().length > 0) {
                        try {
                            // Chunk the text with proper overlap for better context
                            const textChunks = chunkText(pdfText, 1000, 200);
                            const chunksWithPages = textChunks.map((chunk, idx) => {
                                // Estimate page number based on chunk position
                                const estimatedPages = pageCount || 1;
                                const pageNumber = Math.min(
                                    Math.floor((idx / textChunks.length) * estimatedPages) + 1,
                                    estimatedPages
                                );
                                return { text: chunk.trim(), pageNumber };
                            }).filter(chunk => chunk.text.length > 0); // Filter out empty chunks

                            if (chunksWithPages.length > 0) {
                                await storePdfChunks(pdfDoc.id, metadata.userId, chunksWithPages);
                                console.log(`Stored ${chunksWithPages.length} chunks for PDF ${pdfDoc.id} in Pinecone`);
                            } else {
                                console.warn(`No valid chunks extracted from PDF ${pdfDoc.id}`);
                            }
                        } catch (embeddingError) {
                            console.error(`Error storing PDF chunks in Pinecone:`, embeddingError);
                            // Continue even if embedding fails - PDF.ai can still handle queries
                        }
                    } else if (pdfAiFileId) {
                        console.log(`PDF ${pdfDoc.id} uploaded to PDF.ai but text extraction failed. PDF.ai will handle queries on-demand.`);
                    } else {
                        console.warn(`PDF ${pdfDoc.id} has no text content and no PDF.ai file ID. Embeddings cannot be created.`);
                    }

                    // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
                    // UploadThing passes this as serverData
                    return {
                        uploadedBy: metadata.userId,
                        url: file.url,
                        pdfDocumentId: pdfDoc.id,
                        pdfAiFileId: pdfAiFileId,
                        fileName: file.name,
                    };
                } else {
                    throw new Error("Failed to create PDF document record");
                }
            } catch (error) {
                console.error("Error processing PDF:", error);
                // Still return the file info even if processing fails
                return {
                    uploadedBy: metadata.userId,
                    url: file.url,
                    error: error instanceof Error ? error.message : "Unknown error",
                };
            }
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
