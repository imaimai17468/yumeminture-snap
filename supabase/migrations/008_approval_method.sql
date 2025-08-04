-- Check if the enum type already exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_method') THEN
        CREATE TYPE approval_method AS ENUM ('manual', 'auto', 'domain');
    END IF;
END$$;

-- Add approval_method column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'organizations' 
                   AND column_name = 'approval_method') THEN
        ALTER TABLE organizations 
        ADD COLUMN approval_method approval_method DEFAULT 'manual';
    END IF;
END$$;

-- Add approval_domains column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'organizations' 
                   AND column_name = 'approval_domains') THEN
        ALTER TABLE organizations 
        ADD COLUMN approval_domains jsonb DEFAULT '[]'::jsonb;
    END IF;
END$$;