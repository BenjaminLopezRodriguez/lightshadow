import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { env } from "@/env";
import { db } from "@/server/db";
import { pdfDocuments } from "@/server/db/schema";
import { storePdfChunks, chunkText } from "@/lib/pinecone";
// @ts-expect-error - pdf-parse doesn't have proper TypeScript exports
import pdfParse from "pdf-parse";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
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

                // Step 2: Download and parse PDF
                const pdfResponse = await fetch(file.url);
                const pdfBuffer = await pdfResponse.arrayBuffer();
                const pdfData = await pdfParse(Buffer.from(pdfBuffer));

                // Step 3: Store PDF metadata in database
                const [pdfDoc] = await db
                    .insert(pdfDocuments)
                    .values({
                        userId: metadata.userId,
                        fileName: file.name,
                        fileUrl: file.url,
                        pdfAiFileId: pdfAiFileId || undefined,
                        uploadthingFileKey: file.key,
                        pageCount: pdfData.numpages,
                    })
                    .returning();

                // Step 4: Chunk PDF text and store in Pinecone
                if (pdfDoc) {
                    const textChunks = chunkText(pdfData.text, 1000, 200);
                    const chunksWithPages = textChunks.map((chunk, idx) => {
                        // Estimate page number based on chunk position
                        const pageNumber = Math.floor((idx / textChunks.length) * pdfData.numpages) + 1;
                        return { text: chunk, pageNumber };
                    });

                    await storePdfChunks(pdfDoc.id, metadata.userId, chunksWithPages);

                    console.log(`Stored ${chunksWithPages.length} chunks for PDF ${pdfDoc.id}`);

                    // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
                    return {
                        uploadedBy: metadata.userId,
                        url: file.url,
                        pdfDocumentId: pdfDoc.id,
                        pdfAiFileId: pdfAiFileId,
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
