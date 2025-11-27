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
  try {
    // Ensure text is not empty
    if (!text || text.trim().length === 0) {
      throw new Error("Cannot generate embedding for empty text");
    }

    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text.trim(),
    });

    const embedding = response.data[0]?.embedding;
    if (!embedding || embedding.length === 0) {
      throw new Error("Received empty embedding from OpenAI");
    }

    return embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

// Chunk text into smaller pieces for better retrieval
// Tries to break on sentence boundaries when possible
export function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/); // Split on sentence boundaries
  let currentChunk = "";
  
  for (const sentence of sentences) {
    // If adding this sentence would exceed chunk size, save current chunk
    if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      
      // Start new chunk with overlap from previous chunk
      const words = currentChunk.split(/\s+/);
      const overlapWords = words.slice(-Math.floor(overlap / 10)); // Approximate word count for overlap
      currentChunk = overlapWords.join(" ") + " " + sentence;
    } else {
      currentChunk += (currentChunk ? " " : "") + sentence;
    }
  }
  
  // Add the last chunk if it exists
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  // Fallback: if sentence-based chunking didn't work well, use character-based
  if (chunks.length === 0 || chunks.some(chunk => chunk.length > chunkSize * 1.5)) {
    const fallbackChunks: string[] = [];
    let start = 0;
    
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      fallbackChunks.push(text.slice(start, end).trim());
      start = end - overlap;
    }
    
    return fallbackChunks.filter(chunk => chunk.length > 0);
  }
  
  return chunks.filter(chunk => chunk.length > 0);
}

// Store PDF chunks in Pinecone
export async function storePdfChunks(
  pdfDocumentId: number,
  userId: string,
  chunks: { text: string; pageNumber?: number }[]
): Promise<void> {
  if (!chunks || chunks.length === 0) {
    console.warn("No chunks provided to storePdfChunks");
    return;
  }

  const index = await getPineconeIndex();
  
  // Filter out empty chunks before processing
  const validChunks = chunks.filter(chunk => chunk.text && chunk.text.trim().length > 0);
  
  if (validChunks.length === 0) {
    console.warn("No valid chunks to embed after filtering");
    return;
  }

  console.log(`Generating embeddings for ${validChunks.length} chunks...`);
  
  const vectors = await Promise.all(
    validChunks.map(async (chunk, idx) => {
      try {
        const embedding = await generateEmbedding(chunk.text);
        
        if (!embedding || embedding.length === 0) {
          throw new Error(`Empty embedding generated for chunk ${idx}`);
        }

        return {
          id: `pdf_${pdfDocumentId}_chunk_${idx}`,
          values: embedding,
          metadata: {
            pdfDocumentId,
            userId,
            text: chunk.text.substring(0, 10000), // Limit metadata text size (Pinecone has limits)
            pageNumber: chunk.pageNumber || 0,
            chunkIndex: idx,
          },
        };
      } catch (error) {
        console.error(`Error generating embedding for chunk ${idx}:`, error);
        throw error;
      }
    })
  );

  // Filter out any failed embeddings
  const validVectors = vectors.filter(v => v && v.values && v.values.length > 0);

  if (validVectors.length === 0) {
    throw new Error("No valid embeddings generated");
  }

  console.log(`Upserting ${validVectors.length} vectors to Pinecone...`);

  // Upsert in batches of 100 (Pinecone limit)
  for (let i = 0; i < validVectors.length; i += 100) {
    const batch = validVectors.slice(i, i + 100);
    try {
      await index.upsert(batch);
      console.log(`Upserted batch ${Math.floor(i / 100) + 1} (${batch.length} vectors)`);
    } catch (error) {
      console.error(`Error upserting batch ${Math.floor(i / 100) + 1}:`, error);
      throw error;
    }
  }

  console.log(`Successfully stored ${validVectors.length} chunks for PDF ${pdfDocumentId}`);
}

// Query Pinecone for relevant PDF chunks
export async function queryPdfChunks(
  query: string,
  userId: string,
  pdfDocumentIds?: number[],
  topK: number = 5
): Promise<Array<{ text: string; pdfDocumentId: number; pageNumber: number; score: number }>> {
  try {
    const index = await getPineconeIndex();
    const queryEmbedding = await generateEmbedding(query);

    // Build filter - Pinecone filter syntax
    const filter: any = {};
    
    // Add userId filter
    if (userId) {
      filter.userId = userId;
    }
    
    // Add PDF document IDs filter - use $in for array
    if (pdfDocumentIds && pdfDocumentIds.length > 0) {
      if (pdfDocumentIds.length === 1) {
        filter.pdfDocumentId = pdfDocumentIds[0];
      } else {
        filter.pdfDocumentId = { $in: pdfDocumentIds };
      }
    }

    console.log(`Querying Pinecone with filter:`, JSON.stringify(filter));

    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
      filter,
    });

    const results = (
      queryResponse.matches?.map((match) => ({
        text: (match.metadata?.text as string) || "",
        pdfDocumentId: (match.metadata?.pdfDocumentId as number) || 0,
        pageNumber: (match.metadata?.pageNumber as number) || 0,
        score: match.score || 0,
      })) || []
    ).filter(r => r.text.length > 0); // Filter out empty results

    console.log(`Pinecone query returned ${results.length} results`);
    return results;
  } catch (error) {
    console.error("Error querying Pinecone:", error);
    throw error;
  }
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
    userId: userId,
    type: "chat_response",
  };

  if (pdfDocumentIds && pdfDocumentIds.length > 0) {
    if (pdfDocumentIds.length === 1) {
      filter.pdfDocumentIds = pdfDocumentIds[0];
    } else {
      filter.pdfDocumentIds = { $in: pdfDocumentIds };
    }
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
