# How to Run the Database Migration

## Option 1: Using Drizzle Kit (Recommended if you have database access)

When you have access to your database, run:

```bash
pnpm db:push
```

This will automatically apply the schema changes.

## Option 2: Run SQL Migration File Directly

If you prefer to run SQL directly, use the incremental migration file:

```bash
# Using psql
psql $DATABASE_URL -f drizzle/0001_add_pdf_tables.sql

# Or with explicit connection string
psql "postgresql://user:password@host:port/database" -f drizzle/0001_add_pdf_tables.sql
```

## Option 3: Via Vercel Dashboard

1. Go to your Vercel project dashboard
2. Navigate to Storage → Your Postgres database
3. Open the SQL Editor
4. Copy and paste the contents of `drizzle/0001_add_pdf_tables.sql`
5. Execute the SQL

## Option 4: Using Drizzle Migrate (if you have migrations set up)

```bash
pnpm db:migrate
```

## Verification

After running the migration, verify the tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('lightshadow_pdf_document', 'lightshadow_chat_pdf_reference');
```

Both tables should appear in the results.

## What Gets Created

- ✅ `lightshadow_pdf_document` - Stores PDF metadata and file information
- ✅ `lightshadow_chat_pdf_reference` - Links PDFs to specific chats
- ✅ All necessary indexes for performance
- ✅ Foreign key constraints for data integrity
