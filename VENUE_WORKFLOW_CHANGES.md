# What Changes You Should See - Venue Workflow System

## 🔧 **FIRST: Run the Database Migration**
**IMPORTANT:** You need to run the database migration first, otherwise you'll see errors.
1. Follow the steps in `MANUAL_MIGRATION_STEPS.md`
2. Run all the SQL commands in your Supabase dashboard
3. Restart your development server

## 🎯 **Changes You Should See After Migration:**

### 1. **Updated Venues Page** (`/venues`)
- **Status Badges**: Each venue now shows a colored badge (Info Only, Verified, Claimed, Bookable, Suspended)
- **New Filter**: "Show only bookable" checkbox in the search filters
- **Different Action Buttons**:
  - **Info-only venues**: "Request a Slot" + "Own this venue? Claim it" buttons
  - **Bookable venues**: "Book Now" button (green)
  - **Claimed venues**: "Contact Owner" button (yellow)
- **Status Subtitles**: Small text under venue names indicating booking status

### 2. **New Admin Dashboard Tab** (`/admin` → Venues tab)
- **Overview Tab**: Statistics dashboard showing venue counts by status, leads, claims
- **Leads Tab**: Table of all venue lead requests with status management
- **Claims Tab**: Table of all venue ownership claims with verification actions
- **Data Quality Tab**: Venue quality scoring system (placeholder for now)

### 3. **New Player Page** (`/my-requests`)
- **Lead Requests Tab**: View all your venue slot requests and their status
- **Claim Requests Tab**: View all your venue ownership claims and their status
- **Status Tracking**: See if venues have contacted you, won/lost your requests

### 4. **New Navigation Links**
- **Players**: "My Requests" link in the header navigation
- **All Users**: Updated venue cards with workflow-specific buttons

### 5. **New Modal Forms**
- **Lead Form**: When clicking "Request a Slot" on info-only venues
  - Date/time picker
  - Duration selection
  - Contact phone and notes
- **Claim Form**: When clicking "Own this venue? Claim it"
  - Contact information
  - File upload for ownership proof
  - Optional message

## 🚨 **Current Issues & Solutions:**

### **Issue 1: "0 venues" on Venues page**
**Cause**: The venues page is now using the new workflow service which filters by status
**Solution**: After running the migration, existing venues will have `status = 'seeded'` and should appear

### **Issue 2: Can't delete venues in admin**
**Cause**: The admin dashboard is now using the new workflow management component
**Solution**: The new admin interface has different controls - venues are managed through status changes rather than deletion

### **Issue 3: Old venue forms still showing**
**Cause**: We updated the admin dashboard but there might be cached components
**Solution**: 
1. Hard refresh your browser (Ctrl+F5 or Cmd+Shift+R)
2. Clear browser cache
3. Restart development server

## 🔄 **Migration Status Check:**

Run this SQL in your Supabase dashboard to check if migration worked:

```sql
-- Check if new columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'sports_facilities' 
AND column_name IN ('status', 'listing_type', 'booking_mode', 'data_quality_score');

-- Check if new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('venue_leads', 'venue_claim_requests');

-- Check venue statuses
SELECT name, status, listing_type, booking_mode, data_quality_score 
FROM sports_facilities 
LIMIT 5;
```

## 🎮 **How to Test the New Features:**

### **As a Player:**
1. Go to `/venues` - you should see venues with "Info Only" badges
2. Click "Request a Slot" on any venue
3. Fill out the lead form and submit
4. Go to `/my-requests` to see your request
5. Try claiming a venue with the "Own this venue?" button

### **As an Admin:**
1. Go to `/admin` and click the "Venues" tab
2. You should see the new workflow dashboard with 4 tabs
3. Check the Overview tab for statistics
4. Look at the Leads and Claims tabs for any submitted requests
5. Try updating venue statuses and lead/claim statuses

### **Expected Workflow:**
1. **Admin** seeds venues (status: seeded, info-only)
2. **Players** discover venues and submit lead requests
3. **Venue owners** claim venues with proof
4. **Admin** verifies claims and updates venue status
5. **Claimed owners** can eventually make venues bookable

## 🐛 **Troubleshooting:**

If you're still seeing issues:
1. Check browser console for errors
2. Verify database migration completed successfully
3. Ensure all new component files are in the correct locations
4. Try hard refresh and clear cache
5. Check that your user role is set correctly in Supabase auth.users table


