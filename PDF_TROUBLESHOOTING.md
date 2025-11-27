# PDF Context Troubleshooting Guide

## Issues Fixed

I've made several improvements to ensure PDFs are properly referenced and their context is used in chat:

### 1. **Improved PDF Context Retrieval**
   - Added better error handling and logging
   - Fixed Pinecone filter syntax
   - Ensured PDF context is always queried when PDFs are referenced
   - Added fallback messages when no context is found

### 2. **Better PDF-Chat Linking**
   - PDFs are now properly linked to chats when uploaded
   - PDF references persist across chat messages
   - Improved handling of PDF document IDs

### 3. **Enhanced System Context**
   - Stronger instructions to the AI to use PDF content
   - Better formatting of PDF context in system messages
   - Fallback handling when Pinecone queries fail

## Common Issues & Solutions

### Issue: "I can't access PDFs" or generic responses

**Possible Causes:**

1. **PDF not stored in Pinecone**
   - Check server logs for "Stored X chunks for PDF" message
   - Verify PDF was uploaded successfully
   - Check Pinecone index has vectors

2. **PDF not linked to chat**
   - Check database: `SELECT * FROM lightshadow_chat_pdf_reference WHERE "chatId" = ?`
   - Verify `pdfDocumentId` is being passed from frontend

3. **Pinecone query failing**
   - Check server logs for "Error querying Pinecone"
   - Verify Pinecone API key is correct
   - Check Pinecone index name matches `PINECONE_INDEX_NAME` env var
   - Verify index dimension is 1536 (for text-embedding-3-small)

4. **No matching chunks found**
   - Query might be too specific
   - PDF might not contain relevant content
   - Check logs for "Found X relevant chunks"

### Debugging Steps

1. **Check Server Logs**
   Look for these log messages:
   ```
   Querying Pinecone for PDF context. PDF IDs: X, User: Y
   Querying Pinecone with filter: {...}
   Found X relevant chunks from Pinecone
   Sending to OpenAI. Has PDF context: true, PDF IDs: X
   ```

2. **Verify Database**
   ```sql
   -- Check if PDF exists
   SELECT * FROM lightshadow_pdf_document WHERE "userId" = 'your-user-id';
   
   -- Check if PDF is linked to chat
   SELECT * FROM lightshadow_chat_pdf_reference WHERE "chatId" = your-chat-id;
   ```

3. **Check Pinecone Index**
   - Go to Pinecone dashboard
   - Verify index exists and has vectors
   - Check index dimension (should be 1536)
   - Verify metadata includes: userId, pdfDocumentId, text, pageNumber

4. **Test Pinecone Query Manually**
   You can test if Pinecone is working by checking the server logs when you send a message with a PDF attached.

## Expected Behavior

When a PDF is uploaded and used in chat:

1. ✅ PDF is uploaded to UploadThing
2. ✅ PDF is uploaded to PDF.ai (if API key configured)
3. ✅ PDF is parsed and chunked
4. ✅ Chunks are stored in Pinecone with embeddings
5. ✅ PDF metadata is saved to database
6. ✅ PDF is linked to the chat
7. ✅ When user asks a question, Pinecone is queried for relevant chunks
8. ✅ Relevant chunks are added as system context
9. ✅ AI responds using PDF context

## Environment Variables Required

Make sure these are set in Vercel:

```
PINECONE_API_KEY=pcsk_6e7Dx8_HunFsDGVkrVxpjSzj4HcCsM9zK1U74dUFbjyRbojf1iT93wKK9EAnycEgYmMXw2
PINECONE_INDEX_NAME=pdf-documents
OPENAI_API_KEY=your-openai-key (for embeddings)
PDFAI_API_KEY=your-pdfai-key (optional but recommended)
```

## Pinecone Index Setup

Your Pinecone index should have:
- **Name**: `pdf-documents` (or match `PINECONE_INDEX_NAME`)
- **Dimension**: `1536` (for text-embedding-3-small)
- **Metric**: `cosine`
- **Metadata**: Should support userId (string), pdfDocumentId (number), text (string), pageNumber (number)

## Next Steps if Still Not Working

1. Check Vercel function logs for errors
2. Verify Pinecone index is accessible
3. Test with a simple PDF first
4. Check that PDF chunks were actually stored (check Pinecone dashboard)
5. Verify the query is finding matches (check similarity scores in logs)
