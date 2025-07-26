-- Migration: Add funding fields to campaigns table
-- Date: 2024-12-01
-- Description: Adds funding_goal and current_funding columns to support fundraising campaigns

-- Add funding_goal column (optional fundraising target)
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS funding_goal DECIMAL(10,2);

-- Add current_funding column (amount currently raised)
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS current_funding DECIMAL(10,2) DEFAULT 0;

-- Add check constraints (using DO block since IF NOT EXISTS not supported for CHECK)
DO $$
BEGIN
    -- Check constraint to ensure current_funding is not negative
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_current_funding_non_negative') THEN
        ALTER TABLE campaigns 
        ADD CONSTRAINT check_current_funding_non_negative 
        CHECK (current_funding >= 0);
    END IF;
    
    -- Check constraint to ensure funding_goal is positive when set
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_funding_goal_positive') THEN
        ALTER TABLE campaigns 
        ADD CONSTRAINT check_funding_goal_positive 
        CHECK (funding_goal IS NULL OR funding_goal > 0);
    END IF;
    
    -- Check constraint to ensure current_funding doesn't exceed funding_goal
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_current_funding_not_exceed_goal') THEN
        ALTER TABLE campaigns 
        ADD CONSTRAINT check_current_funding_not_exceed_goal 
        CHECK (funding_goal IS NULL OR current_funding <= funding_goal);
    END IF;
END $$;

-- Add index for queries filtering by funding goals
CREATE INDEX IF NOT EXISTS idx_campaigns_funding_goal 
ON campaigns(funding_goal) WHERE funding_goal IS NOT NULL;

-- Add index for funding progress calculations
CREATE INDEX IF NOT EXISTS idx_campaigns_funding_progress 
ON campaigns(current_funding, funding_goal) WHERE funding_goal IS NOT NULL;

-- Verify migration completed successfully
DO $$
BEGIN
    -- Check that columns exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'campaigns' AND column_name = 'funding_goal') THEN
        RAISE EXCEPTION 'Migration failed: funding_goal column not created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'campaigns' AND column_name = 'current_funding') THEN
        RAISE EXCEPTION 'Migration failed: current_funding column not created';
    END IF;
    
    RAISE NOTICE 'Migration completed successfully: funding fields added to campaigns table';
END $$; 