# Getting Started Guide: Venue Workflow + Payment System

## 🚀 Quick Start

### Step 1: Apply Database Migration
1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy the entire contents of `COMPLETE_MIGRATION_SCRIPT.sql`
4. Paste it into the SQL Editor
5. Click **Run** to execute

### Step 2: Verify Migration Success
After running the migration, you should see:
- ✅ "Migration completed successfully!" message
- ✅ New columns in `sports_facilities` table
- ✅ New tables: `venue_leads`, `venue_claim_requests`, `payment_methods`, `tournament_commissions`, `player_registration_fees`, `payment_verifications`

### Step 3: Test the System
1. **Start your development server**: `npm run dev`
2. **Login as Admin** to test venue management
3. **Login as Player** to test venue discovery and lead requests
4. **Login as Organizer** to test tournament creation with payment integration

## 🔧 What This System Provides

### For Players:
- **Venue Discovery**: Browse all venues (seeded, verified, claimed, bookable)
- **Lead Requests**: Submit booking inquiries for info-only venues
- **Venue Claims**: Claim ownership of venues
- **Payment**: Pay registration fees via QR codes

### For Organizers:
- **Tournament Creation**: Create tournaments with custom games
- **Commission Payments**: Pay platform fees via QR codes
- **Tournament Management**: Edit tournaments after submission

### For Admins:
- **Venue Workflow Management**: Approve/verify venues, manage leads and claims
- **Revenue Dashboard**: Track all payments and commissions
- **Content Quality**: Monitor venue data quality scores

## 🎯 Key Features

### 1. Venue Workflow System
- **Status Management**: seeded → verified → claimed → bookable → suspended
- **Lead Management**: Players can request venue availability
- **Claim Verification**: Admins verify venue ownership claims
- **Data Quality Scoring**: Automatic scoring based on venue completeness

### 2. Payment System
- **QR Code Payments**: eSewa and Bank QR integration
- **Commission Tracking**: 10% platform fee on tournaments
- **Registration Fees**: Player payment tracking
- **Payment Verification**: Admin approval workflow

### 3. Tournament Enhancements
- **Custom Games**: Players can specify custom sport types
- **Date Logic Fix**: Proper registration deadline handling
- **Payment Integration**: Automatic commission calculation
- **Editability**: Tournaments remain editable after approval

## 🚨 Troubleshooting

### Common Issues & Solutions

#### 1. "No venues showing in admin"
**Cause**: Database migration not applied or venue workflow service failing
**Solution**: 
- Run the migration script
- Check browser console for errors
- Verify `venueWorkflowService` is working

#### 2. "Add venue form keeps loading"
**Cause**: Database connection issues or missing fields
**Solution**:
- Ensure migration is complete
- Check Supabase connection
- Verify all required fields exist

#### 3. "Tournament shows as closed"
**Cause**: Date comparison issues
**Solution**: 
- Fixed in `TournamentCard.tsx` and `TournamentDetails.tsx`
- Uses `setHours(0, 0, 0, 0)` for accurate date-only comparison

#### 4. "Payment system not found"
**Cause**: Payment tables not created
**Solution**: 
- Run the complete migration script
- Verify `payment_methods` table exists

### Debug Commands

Check your database schema:
```sql
-- Verify venue workflow fields
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sports_facilities' 
AND column_name IN ('status', 'listing_type', 'booking_mode');

-- Verify payment tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%payment%';
```

## 📱 Testing the System

### Test as Admin:
1. **Add New Venue**: Use the "Add New Venue" button
2. **Manage Leads**: Check the Leads tab for player requests
3. **Verify Claims**: Review venue ownership claims
4. **Revenue Dashboard**: Monitor payment transactions

### Test as Player:
1. **Browse Venues**: Visit `/venues` to see all venues
2. **Submit Lead**: Request availability for a venue
3. **Claim Venue**: Submit ownership claim
4. **Track Requests**: Check `/my-requests` for status

### Test as Organizer:
1. **Create Tournament**: Use enhanced tournament form
2. **Custom Games**: Try the "Custom Game" option
3. **Payment Integration**: Verify commission calculation
4. **Edit Tournament**: Make changes after submission

## 🔒 Security Features

### Row Level Security (RLS):
- **Venue Leads**: Users can only see their own leads
- **Claims**: Users can only see their own claims
- **Payments**: Users can only see their own transactions
- **Admin Access**: Admins can view and manage all data

### Role-Based Access:
- **Admin**: Full access to all features
- **Organizer**: Tournament creation and management
- **Player**: Venue discovery and lead submission

## 📊 Monitoring & Analytics

### Admin Dashboard Metrics:
- Total venues by status
- Lead conversion rates
- Payment verification status
- Revenue tracking
- Data quality scores

### Data Quality Scoring:
- **Images**: 20 points (if present)
- **Description**: 20 points (if >200 characters)
- **Amenities**: 10 points (if ≥5 amenities)
- **Google Maps**: 10 points (if linked)
- **Contact Info**: 10 points (if provided)
- **Verification**: 30 points (if verified)

## 🚀 Next Steps

After getting the system running:

1. **Customize Payment Methods**: Add your actual QR codes
2. **Configure Commission Rates**: Adjust platform fees
3. **Set Up Notifications**: Email alerts for new leads/claims
4. **Add Analytics**: Track user engagement and conversion
5. **Mobile Optimization**: Ensure responsive design works

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Verify database migration success
3. Test individual components in isolation
4. Check Supabase logs for database errors

The system is designed to be robust and handle edge cases gracefully. Most issues can be resolved by ensuring the database migration is complete and all services are properly connected.


