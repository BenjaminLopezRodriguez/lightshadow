-- Add mentions and reply functionality to messages table
ALTER TABLE "lightshadow_message" ADD COLUMN IF NOT EXISTS "replyToMessageId" integer;
ALTER TABLE "lightshadow_message" ADD COLUMN IF NOT EXISTS "mentions" json;

--> statement-breakpoint
-- Add foreign key constraint for replyToMessageId
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'lightshadow_message_replyToMessageId_lightshadow_message_id_fk'
    ) THEN
        ALTER TABLE "lightshadow_message" 
        ADD CONSTRAINT "lightshadow_message_replyToMessageId_lightshadow_message_id_fk" 
        FOREIGN KEY ("replyToMessageId") REFERENCES "public"."lightshadow_message"("id") ON DELETE set null ON UPDATE no action;
    END IF;
END $$;

--> statement-breakpoint
-- Add index for replyToMessageId
CREATE INDEX IF NOT EXISTS "message_reply_idx" ON "lightshadow_message" USING btree ("replyToMessageId");
