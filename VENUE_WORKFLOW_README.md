# Venue Workflow System

## Overview

The Venue Workflow System implements a comprehensive lifecycle management system for sports venues, allowing admins to seed venues, players to discover and submit lead requests, and owners to claim venues to become bookable.

## System Architecture

### Venue Lifecycle States

1. **Seeded** (Default) - Admin-added, visible in search with "Info only" badge
2. **Verified** - Admin double-checked details, still info-only
3. **Claimed** - Owner verified via claim request, partner dashboard enabled
4. **Bookable** - Courts + pricing configured, instant booking enabled
5. **Suspended** - Hidden from public search

### Data Model Changes

#### New Fields in `sports_facilities` Table
- `status`: one of seeded | verified | claimed | bookable | suspended
- `listing_type`: info_only | external_link | on_platform
- `booking_mode`: none | lead_form | external | internal
- `source`: admin_manual | user_suggested | maps_import
- `data_quality_score`: int (0–100)
- `claimed_by`: user id (nullable)
- `last_verified_at`: timestamptz (nullable)
- `price_range_min`, `price_range_max`: int (NPR)

#### New Tables

**`venue_leads`**
- id, venue_id, user_id, requested_date, start_minute, duration_min
- notes, contact_phone, status, created_at, updated_at

**`venue_claim_requests`**
- id, venue_id, contact_name, phone, email, proof_url
- status, claimed_by, message, created_at, updated_at

## Implementation Details

### Database Migration

Run the migration file: `supabase/migrations/20250101000003_venue_workflow.sql`

This migration:
- Adds new fields to existing venues table
- Creates new tables for leads and claims
- Sets up indexes and triggers
- Initializes existing venues with default status 'seeded'
- Calculates initial data quality scores

### Core Services

#### `venueWorkflowService.ts`
- Venue status management
- Lead and claim request handling
- Data quality scoring
- Workflow statistics

### Components

#### Venue Discovery
- **`VenueStatusBadge`** - Displays venue status with appropriate colors and text
- **Updated `Venues.tsx`** - Enhanced with workflow features, status badges, and appropriate CTAs

#### Lead Management
- **`VenueLeadForm`** - Modal for players to submit venue lead requests
- **`MyRequests.tsx`** - Page for players to track their leads and claims

#### Claim Management
- **`VenueClaimForm`** - Modal for venue owners to submit claim requests
- **`VenueWorkflowManagement.tsx`** - Admin interface for managing workflow

## User Flows

### Admin Workflow
1. **Seed Venues**: Add venues with status 'seeded' (info-only, not bookable)
2. **Verify Details**: Update status to 'verified' after double-checking
3. **Process Claims**: Review and verify venue ownership claims
4. **Enable Booking**: Set status to 'bookable' when courts + pricing are ready

### Player Workflow
1. **Discover Venues**: Browse seeded/verified venues with clear status indicators
2. **Submit Leads**: Use lead form to request slots from info-only venues
3. **Track Requests**: View status of submitted leads in "My Requests" page

### Owner Workflow
1. **Claim Venue**: Submit ownership proof via claim form
2. **Wait Verification**: Admin reviews and verifies claim
3. **Setup Venue**: Configure courts, pricing, and amenities
4. **Enable Booking**: Admin enables instant booking when ready

## Features

### Status Badges
- Clear visual indicators for each venue status
- Consistent color coding and descriptions
- Responsive design for different screen sizes

### Lead Management
- Date, time, and duration selection
- Contact information and notes
- Status tracking (new → contacted → closed_won/lost)
- Admin queue for managing leads

### Claim Verification
- Document upload for ownership proof
- Contact information validation
- Admin review and verification process
- Automatic venue status updates

### Data Quality Scoring
- Automated scoring based on:
  - Photos (20 points)
  - Description length (20 points)
  - Amenities count (10 points)
  - Map links (10 points)
  - Contact information (10 points)
  - Verification status (30 points)

### Search & Filtering
- Filter by venue status
- Show only bookable venues option
- Search by location, sports, amenities
- Price range filtering

## Security & Access Control

### Row Level Security (RLS)
- **Venues**: Public read access (except suspended), admin write access
- **Leads**: Users can only read their own leads, admins can read all
- **Claims**: Users can read their own claims, admins can read all and update status

### Role-Based Access
- **Admin**: Full access to all workflow management
- **Organizer/Partner**: Can claim venues and manage claimed venues
- **Player**: Can submit leads and view their requests

## API Endpoints

### Venue Management
- `GET /venues` - Discoverable venues with workflow status
- `PUT /venues/:id/status` - Update venue status (admin only)

### Lead Management
- `POST /venue_leads` - Create new lead request
- `GET /venue_leads/user/:id` - Get user's leads
- `GET /venue_leads` - Get all leads (admin only)
- `PUT /venue_leads/:id/status` - Update lead status (admin only)

### Claim Management
- `POST /venue_claim_requests` - Submit claim request
- `GET /venue_claim_requests/user/:id` - Get user's claims
- `GET /venue_claim_requests` - Get all claims (admin only)
- `PUT /venue_claim_requests/:id/verify` - Verify claim (admin only)

## Configuration

### Environment Variables
Ensure your Supabase configuration is properly set up in `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup
1. Run the migration file
2. Verify tables and fields are created
3. Check RLS policies are in place
4. Test with sample data

## Usage Examples

### Admin Seeding a Venue
```typescript
// Venue is automatically created with status 'seeded'
await venueAdminService.addVenueManually({
  name: "Kathmandu Sports Complex",
  description: "Multi-sport facility in the heart of Kathmandu",
  // ... other fields
});
// Status defaults to 'seeded'
```

### Player Submitting a Lead
```typescript
await venueWorkflowService.createVenueLead({
  venue_id: "venue-uuid",
  user_id: "user-uuid",
  requested_date: "2024-01-15",
  start_minute: 540, // 9:00 AM
  duration_min: 60,
  notes: "Need basketball court for team practice",
  contact_phone: "+977-1-4444444"
});
```

### Admin Verifying a Claim
```typescript
await venueWorkflowService.verifyClaimRequest(
  "claim-uuid",
  "verified",
  "admin-user-uuid"
);
// Automatically updates venue status to 'claimed'
```

## Troubleshooting

### Common Issues

1. **Migration Errors**: Ensure Supabase is accessible and user has proper permissions
2. **RLS Policy Issues**: Check that policies are properly applied to new tables
3. **Type Errors**: Verify TypeScript types are updated after migration
4. **Component Import Errors**: Check file paths and component exports

### Debug Steps

1. Check browser console for JavaScript errors
2. Verify Supabase connection in network tab
3. Test database queries directly in Supabase dashboard
4. Check RLS policies are working correctly

## Future Enhancements

### Planned Features
- Email notifications for lead and claim updates
- Bulk venue status management
- Advanced data quality analytics
- Automated venue verification workflows
- Integration with payment systems for premium features

### Performance Optimizations
- Implement caching for frequently accessed data
- Add pagination for large datasets
- Optimize database queries with proper indexing
- Implement real-time updates using Supabase subscriptions

## Support

For technical support or questions about the venue workflow system:
1. Check this README for common solutions
2. Review the database migration logs
3. Test with sample data in development environment
4. Contact the development team with specific error details

## License

This implementation follows the same license as the main project. Please refer to the project's main LICENSE file for details.


