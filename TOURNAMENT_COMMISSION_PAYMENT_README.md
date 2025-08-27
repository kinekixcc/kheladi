# Tournament Commission Payment Flow

## Overview
This document describes the new tournament commission payment flow that organizers must complete before their tournaments are created and activated.

## Flow Description

### 1. Tournament Creation Form
- Organizers fill out the tournament creation form in `/create-tournament`
- The form shows a revenue projection with the 5% platform commission
- A note informs users that commission payment is required
- The submit button now says "Continue to Payment" instead of "Create Tournament"

### 2. Commission Payment Page
- After form submission, organizers are redirected to `/tournament-commission-payment`
- This page shows:
  - Payment summary with tournament name and amount due
  - Progress indicator showing the 3-step process
  - Commission breakdown (same as in creation form)
  - Payment method selection (eSewa, QR Code, Bank Transfer)

### 3. Payment Processing
- **eSewa Payment**: Uses the existing ESewaPayment component with commission-specific handling
- **QR Code Payment**: Placeholder for future QR code generation
- **Bank Transfer**: Shows bank details and confirmation button

### 4. Tournament Creation
- After successful payment, the tournament is created in the database
- Commission record is marked as 'paid'
- Admin notification is sent if approval is required
- User is redirected to organizer dashboard

## Technical Implementation

### New Components
- `TournamentCommissionPayment.tsx` - Main payment page
- Updated `ESewaPayment.tsx` - Added commission payment support
- Updated `CreateTournament.tsx` - Modified to redirect to payment

### Data Flow
1. Tournament data is stored in `localStorage` as `pending_tournament_commission`
2. Payment page reads this data and displays commission breakdown
3. After payment success, data is retrieved and tournament is created
4. Commission record is created with 'paid' status

### Database Changes
- Uses existing `tournament_commissions` table
- Payment status is updated from 'pending' to 'paid'
- Tournament is only created after payment verification

## Commission Calculation
- **Platform Commission**: 5% of total entry fees
- **Total Entry Fees**: Entry fee × Maximum participants
- **Organizer Earnings**: Total entry fees - Platform commission

## Payment Methods

### eSewa (Recommended)
- Integrates with existing eSewa payment system
- Uses dummy payment for testing
- Redirects to eSewa gateway for production

### QR Code Payment
- Placeholder for future implementation
- Would generate QR codes for mobile banking apps

### Bank Transfer
- Shows bank account details
- Requires manual verification by admin
- User must contact support with payment proof

## Error Handling
- Invalid tournament data redirects to creation form
- Payment failures show appropriate error messages
- Network errors are handled gracefully
- Form validation prevents invalid submissions

## Security Considerations
- Tournament data is validated before payment
- Commission amount is calculated server-side
- Payment verification is required before tournament creation
- Admin approval system remains intact

## Future Enhancements
- Real QR code generation for mobile payments
- Integration with more payment gateways
- Automated payment verification
- Commission refund system
- Payment installment options

## Testing
1. Create a tournament with valid data
2. Verify redirect to payment page
3. Test payment methods (use dummy payment for eSewa)
4. Verify tournament creation after payment
5. Check admin notifications
6. Test error scenarios (invalid data, payment failure)

## Troubleshooting
- **Payment page not loading**: Check localStorage for tournament data
- **Commission calculation wrong**: Verify PLATFORM_FEES configuration
- **Tournament not created**: Check payment status and database logs
- **Admin notification missing**: Verify notification service configuration
