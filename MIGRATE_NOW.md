# Run Database Migration Now

## Quick Fix: Run Migration via API

I've created a migration endpoint you can call to create the missing tables.

### Option 1: Via Browser (Easiest)

1. Make sure you're logged into your app
2. Visit: `https://your-app.vercel.app/api/migrate`
3. The migration will run automatically
4. You should see: `{"success": true, "message": "Migration completed successfully"}`

### Option 2: Via curl/terminal

```bash
curl https://your-app.vercel.app/api/migrate
```

### Option 3: Via Vercel Dashboard SQL Editor

1. Go to your Vercel project → Storage → Postgres
2. Open SQL Editor
3. Copy and paste the contents of `drizzle/0001_add_pdf_tables.sql`
4. Execute the SQL

### Option 4: Using Drizzle Kit (if you have database access)

```bash
pnpm db:push
```

## What Gets Created

- ✅ `lightshadow_pdf_document` table
- ✅ `lightshadow_chat_pdf_reference` table  
- ✅ All necessary indexes
- ✅ Foreign key constraints

## Verification

After running the migration, you can verify it worked by checking:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'lightshadow_%';
```

You should see both new tables listed.
