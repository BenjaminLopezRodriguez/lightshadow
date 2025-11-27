# Database Migration Instructions

## Quick Migration (Recommended)

Run the SQL migration file directly on your database:

```bash
# If using psql command line:
psql $DATABASE_URL -f migrations/add_pdf_tables.sql

# Or if you have the connection string:
psql "postgresql://user:password@host:port/database" -f migrations/add_pdf_tables.sql
```

## Using Drizzle Kit (Alternative)

If you prefer using Drizzle Kit:

1. Make sure your `.env` file has all required variables (especially `DATABASE_URL` or `POSTGRES_URL`)
2. Run:
   ```bash
   pnpm db:push
   ```

## What This Migration Does

- Creates `lightshadow_pdf_document` table to store PDF metadata
- Creates `lightshadow_chat_pdf_reference` table to link PDFs to chats
- Adds necessary indexes for performance

## Verification

After running the migration, verify the tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'lightshadow_%';
```

You should see:
- `lightshadow_pdf_document`
- `lightshadow_chat_pdf_reference`
