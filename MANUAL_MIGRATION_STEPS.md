# Manual Database Migration Steps

Since you don't have Supabase CLI installed, you can run the migration manually:

## Step 1: Open Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Create a new query

## Step 2: Run the Migration SQL
Copy and paste the following SQL commands one by one:

### Add new columns to sports_facilities table:
```sql
ALTER TABLE sports_facilities
ADD COLUMN IF NOT EXISTS status text DEFAULT 'seeded' CHECK (status IN ('seeded', 'verified', 'claimed', 'bookable', 'suspended')),
ADD COLUMN IF NOT EXISTS listing_type text DEFAULT 'info_only' CHECK (listing_type IN ('info_only', 'external_link', 'on_platform')),
ADD COLUMN IF NOT EXISTS booking_mode text DEFAULT 'none' CHECK (booking_mode IN ('none', 'lead_form', 'external', 'internal')),
ADD COLUMN IF NOT EXISTS source text DEFAULT 'admin_manual' CHECK (source IN ('admin_manual', 'user_suggested', 'maps_import')),
ADD COLUMN IF NOT EXISTS data_quality_score integer DEFAULT 0 CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
ADD COLUMN IF NOT EXISTS claimed_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS last_verified_at timestamptz,
ADD COLUMN IF NOT EXISTS price_range_min integer,
ADD COLUMN IF NOT EXISTS price_range_max integer;
```

### Create venue_leads table:
```sql
CREATE TABLE IF NOT EXISTS venue_leads (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    venue_id uuid REFERENCES sports_facilities(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    requested_date date NOT NULL,
    start_minute integer NOT NULL CHECK (start_minute >= 0 AND start_minute < 1440),
    duration_min integer NOT NULL CHECK (duration_min > 0 AND duration_min <= 1440),
    notes text,
    contact_phone text NOT NULL,
    status text DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed_won', 'closed_lost')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

### Create venue_claim_requests table:
```sql
CREATE TABLE IF NOT EXISTS venue_claim_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    venue_id uuid REFERENCES sports_facilities(id) ON DELETE CASCADE,
    contact_name text NOT NULL,
    phone text NOT NULL,
    email text NOT NULL,
    proof_url text,
    status text DEFAULT 'new' CHECK (status IN ('new', 'verified', 'rejected')),
    claimed_by uuid REFERENCES auth.users(id),
    message text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

### Create indexes:
```sql
CREATE INDEX IF NOT EXISTS idx_venue_leads_venue_id ON venue_leads(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_leads_user_id ON venue_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_venue_leads_status ON venue_leads(status);
CREATE INDEX IF NOT EXISTS idx_venue_claim_requests_venue_id ON venue_claim_requests(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_claim_requests_status ON venue_claim_requests(status);
CREATE INDEX IF NOT EXISTS idx_sports_facilities_status ON sports_facilities(status);
CREATE INDEX IF NOT EXISTS idx_sports_facilities_claimed_by ON sports_facilities(claimed_by);
```

### Create updated_at trigger function:
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';
```

### Add updated_at triggers:
```sql
CREATE TRIGGER update_venue_leads_updated_at BEFORE UPDATE ON venue_leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_venue_claim_requests_updated_at BEFORE UPDATE ON venue_claim_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Update existing venues:
```sql
UPDATE sports_facilities
SET status = 'seeded',
    listing_type = 'info_only',
    booking_mode = 'none',
    source = 'admin_manual'
WHERE status IS NULL;
```

### Calculate initial data quality scores:
```sql
UPDATE sports_facilities
SET data_quality_score = (
    CASE WHEN images IS NOT NULL AND array_length(images, 1) > 0 THEN 20 ELSE 0 END +
    CASE WHEN length(description) > 200 THEN 20 ELSE 0 END +
    CASE WHEN amenities IS NOT NULL AND array_length(amenities, 1) >= 5 THEN 10 ELSE 0 END +
    CASE WHEN google_maps_link IS NOT NULL AND google_maps_link != '' THEN 10 ELSE 0 END +
    CASE WHEN contact_phone IS NOT NULL AND contact_phone != '' THEN 10 ELSE 0 END +
    CASE WHEN status = 'verified' THEN 30 ELSE 0 END
)
WHERE data_quality_score IS NULL OR data_quality_score = 0;
```

## Step 3: Set up Row Level Security (RLS)
Run these RLS policies:

```sql
-- Enable RLS on new tables
ALTER TABLE venue_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_claim_requests ENABLE ROW LEVEL SECURITY;

-- Venue leads policies
CREATE POLICY "Users can view their own leads" ON venue_leads
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own leads" ON venue_leads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all leads" ON venue_leads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Admins can update lead status" ON venue_leads
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Venue claim requests policies
CREATE POLICY "Users can view their own claims" ON venue_claim_requests
    FOR SELECT USING (auth.uid()::text = claimed_by::text);

CREATE POLICY "Anyone can create claim requests" ON venue_claim_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all claims" ON venue_claim_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Admins can update claim status" ON venue_claim_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );
```

## Step 4: Verify Migration
After running all the SQL commands, verify:
1. Check that the new columns exist in `sports_facilities`
2. Check that `venue_leads` and `venue_claim_requests` tables exist
3. Check that existing venues have `status = 'seeded'`

## Step 5: Restart Your App
After the migration is complete, restart your development server to see the changes.


