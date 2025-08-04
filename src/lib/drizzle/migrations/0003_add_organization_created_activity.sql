-- Add organization_created to activity_type enum
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'organization_created';