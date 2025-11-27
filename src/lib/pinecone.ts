import { Pinecone } from "@pinecone-database/pinecone";
import { env } from "@/env";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

// Initialize Pinecone client
let pineconeClient: Pinecone | null = null;

export function getPineconeClient() {
  if (!pineconeClient) {
    pineconeClient = new Pinecone({
      apiKey: env.PINECONE_API_KEY,
    });
  }
  return pineconeClient;
}

export async function getPineconeIndex() {
  const client = getPineconeClient();
  return client.index(env.PINECONE_INDEX_NAME);
}

// Generate embeddings using OpenAI
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0]?.embedding || [];
}

// Chunk text into smaller pieces for better retrieval
export function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start = end - overlap;
  }
  
  return chunks;
}

// Store PDF chunks in Pinecone
export async function storePdfChunks(
  pdfDocumentId: number,
  userId: string,
  chunks: { text: string; pageNumber?: number }[]
): Promise<void> {
  const index = await getPineconeIndex();
  
  const vectors = await Promise.all(
    chunks.map(async (chunk, idx) => {
      const embedding = await generateEmbedding(chunk.text);
      return {
        id: `pdf_${pdfDocumentId}_chunk_${idx}`,
        values: embedding,
        metadata: {
          pdfDocumentId,
          userId,
          text: chunk.text,
          pageNumber: chunk.pageNumber || 0,
          chunkIndex: idx,
        },
      };
    })
  );

  // Upsert in batches of 100
  for (let i = 0; i < vectors.length; i += 100) {
    const batch = vectors.slice(i, i + 100);
    await index.upsert(batch);
  }
}

// Query Pinecone for relevant PDF chunks
export async function queryPdfChunks(
  query: string,
  userId: string,
  pdfDocumentIds?: number[],
  topK: number = 5
): Promise<Array<{ text: string; pdfDocumentId: number; pageNumber: number; score: number }>> {
  const index = await getPineconeIndex();
  const queryEmbedding = await generateEmbedding(query);

  const filter: any = { userId };
  if (pdfDocumentIds && pdfDocumentIds.length > 0) {
    filter.pdfDocumentId = { $in: pdfDocumentIds };
  }

  const queryResponse = await index.query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
    filter,
  });

  return (
    queryResponse.matches?.map((match) => ({
      text: (match.metadata?.text as string) || "",
      pdfDocumentId: (match.metadata?.pdfDocumentId as number) || 0,
      pageNumber: (match.metadata?.pageNumber as number) || 0,
      score: match.score || 0,
    })) || []
  );
}

// Store chat response in Pinecone for caching
export async function cacheChatResponse(
  query: string,
  response: string,
  userId: string,
  pdfDocumentIds?: number[]
): Promise<void> {
  const index = await getPineconeIndex();
  
  // Create a combined embedding from query + response
  const combinedText = `Query: ${query}\nResponse: ${response}`;
  const embedding = await generateEmbedding(combinedText);

  const metadata: any = {
    userId,
    query,
    response,
    type: "chat_response",
  };

  if (pdfDocumentIds && pdfDocumentIds.length > 0) {
    metadata.pdfDocumentIds = pdfDocumentIds;
  }

  await index.upsert([
    {
      id: `chat_${userId}_${Date.now()}`,
      values: embedding,
      metadata,
    },
  ]);
}

// Query cached responses
export async function queryCachedResponse(
  query: string,
  userId: string,
  pdfDocumentIds?: number[],
  topK: number = 1
): Promise<string | null> {
  const index = await getPineconeIndex();
  const queryEmbedding = await generateEmbedding(query);

  const filter: any = {
    userId,
    type: "chat_response",
  };

  if (pdfDocumentIds && pdfDocumentIds.length > 0) {
    filter.pdfDocumentIds = { $in: pdfDocumentIds };
  }

  const queryResponse = await index.query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
    filter,
  });

  // Filter by score manually (minScore not supported in Pinecone SDK)
  const matches = queryResponse.matches?.filter(m => (m.score || 0) >= 0.8) || [];
  
  if (matches.length > 0 && matches[0]) {
    return (matches[0].metadata?.response as string) || null;
  }

  return null;
}
