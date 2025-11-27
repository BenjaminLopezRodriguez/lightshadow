# Debugging PDF Flow

## How to Debug PDF Issues

### 1. Check Browser Console
When you upload a PDF, check the browser console for:
```
PDF upload complete: { file: {...}, pdfDocumentId: X }
```

### 2. Check Server Logs (Vercel)
Look for these log messages in order:

**On Upload:**
```
Upload complete for userId: ...
file url ...
PDF.ai file ID: ...
Stored X chunks for PDF Y
```

**On Chat Message:**
```
Processing PDF document ID: X for user: Y
PDF document found: filename.pdf, ID: X
Linked PDF X to chat Y
Querying Pinecone for PDF context. PDF IDs: X, User: Y
Querying Pinecone with filter: {...}
Found X relevant chunks from Pinecone
Sending to OpenAI. Has PDF context: true, PDF IDs: X
```

### 3. Common Issues

**Issue: pdfDocumentId is undefined**
- Check browser console for "PDF upload complete" log
- Verify UploadThing is returning serverData correctly
- The pdfDocumentId should be in `res[0].serverData.pdfDocumentId`

**Issue: "No relevant chunks found"**
- Check if PDF chunks were stored: Look for "Stored X chunks" in logs
- Verify Pinecone index has vectors
- Check Pinecone filter is correct (should include userId and pdfDocumentId)

**Issue: PDF not linked to chat**
- Check database: `SELECT * FROM lightshadow_chat_pdf_reference WHERE "chatId" = X`
- Verify PDF exists: `SELECT * FROM lightshadow_pdf_document WHERE "userId" = 'Y'`

### 4. Manual Database Checks

```sql
-- Check if PDF was stored
SELECT id, "fileName", "userId", "createdAt" 
FROM lightshadow_pdf_document 
ORDER BY "createdAt" DESC 
LIMIT 5;

-- Check if PDF is linked to chat
SELECT cpr.*, cd."fileName" 
FROM lightshadow_chat_pdf_reference cpr
JOIN lightshadow_pdf_document cd ON cpr."pdfDocumentId" = cd.id
WHERE cpr."chatId" = YOUR_CHAT_ID;
```

### 5. Test Pinecone Directly

If you have access to Pinecone dashboard:
1. Go to your index
2. Search for vectors with metadata: `userId: "your-user-id"`
3. Verify vectors exist with `pdfDocumentId` metadata
4. Check that `text` metadata contains PDF content
