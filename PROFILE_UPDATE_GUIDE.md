# Profile Update Guide for Players

## Overview

This guide explains how players can update and save their profile information in the KhelKheleko application. The profile update functionality allows players to modify their personal information, preferences, and settings.

## How to Access Profile Settings

### Method 1: Via Header Menu
1. **Log in** to your account
2. **Click on your name** in the top-right corner of the header
3. **Select "Profile"** from the dropdown menu
4. You'll be redirected to `/profile` page

### Method 2: Direct URL
- Navigate directly to: `http://localhost:5173/profile` (or your domain)

## Profile Update Features

### 1. Personal Information Tab
- **Full Name**: Your display name (required)
- **Phone Number**: Contact phone number
- **Location**: Your city/area
- **Date of Birth**: Birth date
- **Skill Level**: Choose from Beginner, Intermediate, Advanced, or Professional
- **Bio**: Personal description (max 500 characters)

### 2. Organization Tab (Organizers Only)
- **Organization Name**: Your organization's name
- **Website**: Organization website URL
- **Description**: About your organization
- **Social Media Links**: Facebook, Instagram, Twitter profiles

### 3. Security Tab
- **Password Change**: Update your password
- **Two-Factor Authentication**: Enable 2FA for extra security

### 4. Notifications Tab
- **Email Notifications**: Tournament updates, registration alerts
- **Push Notifications**: Browser notifications
- **Marketing Emails**: Promotional content (optional)

### 5. Privacy Settings
- **Show Profile Publicly**: Allow others to view your profile
- **Show Contact Information**: Display phone/email to other users
- **Show Statistics**: Display your performance stats
- **Show Achievements**: Display badges and achievements

## How to Update Your Profile

### Step 1: Navigate to Profile Settings
1. Go to the Profile page
2. Ensure you're on the "Personal Info" tab

### Step 2: Make Changes
1. **Click on any field** you want to edit
2. **Type your new information**
3. **Fields will show validation errors** if there are issues
4. **Required fields** are marked with an asterisk (*)

### Step 3: Save Changes
1. **Look for the "Save Changes" button** at the bottom
2. **Button is disabled** until you make changes
3. **Click "Save Changes"** to save your updates
4. **Wait for confirmation** - you'll see a success message

## Form Validation

### Required Fields
- **Full Name**: Must be at least 2 characters

### Optional Fields with Validation
- **Bio**: Maximum 500 characters
- **Website**: Must be a valid URL format
- **Phone**: Should be a valid phone number format

### Real-time Feedback
- **Character count** for bio field
- **Visual indicators** for form errors
- **Save button state** changes based on form modifications

## Troubleshooting

### Common Issues

#### 1. "Database Connection Issue" Message
**Problem**: Red banner showing database connection problem
**Solution**: 
- Check your internet connection
- Verify Supabase configuration in `.env` file
- Contact support if issue persists

#### 2. "Failed to Update Profile" Error
**Problem**: Error message when trying to save
**Solutions**:
- Check if you have permission to edit the profile
- Ensure all required fields are filled
- Try refreshing the page and retry
- Check browser console for detailed error messages

#### 3. Save Button is Disabled
**Problem**: Save button appears grayed out
**Solution**: 
- Make sure you've actually changed some fields
- Check for validation errors in red text
- Ensure you're logged in with the correct account

#### 4. Changes Not Saving
**Problem**: Form resets after clicking save
**Solutions**:
- Check if you're editing your own profile
- Verify database connection status
- Look for error messages in the console

### Debug Information

#### Check Database Connection
1. **Look for green banner** saying "Database Connected"
2. **If red banner appears**, there's a connection issue
3. **Use Testing Panel** (admin only) to test database connectivity

#### Check Form State
1. **Look for "⚠️ You have unsaved changes"** message
2. **Save button should be enabled** when changes are made
3. **Form validation errors** appear below fields

#### Check Console Logs
1. **Open browser developer tools** (F12)
2. **Go to Console tab**
3. **Look for error messages** when saving
4. **Check for "✅ Profile updated successfully"** message

## Testing the Functionality

### For Developers/Admins
1. **Use the Testing Panel** (blue test tube icon)
2. **Test Database Connection** first
3. **Test Profile Retrieval** and **Profile Update**
4. **Check test results** for detailed information

### For Players
1. **Make a small change** (e.g., update bio)
2. **Save the changes**
3. **Refresh the page** to verify persistence
4. **Check if changes appear** in other parts of the app

## Security Features

### Row Level Security (RLS)
- **Users can only edit their own profiles**
- **Admins can edit any profile**
- **Profile data is protected** at the database level

### Permission Checks
- **Edit buttons are disabled** for unauthorized users
- **Form submission is blocked** for non-owners
- **Clear error messages** for permission issues

## Best Practices

### For Players
1. **Keep your information up to date**
2. **Use a strong password** and enable 2FA
3. **Review privacy settings** regularly
4. **Report any issues** to support

### For Organizers
1. **Complete organization details** for verification
2. **Keep contact information current**
3. **Update social media links** regularly

## Support

If you encounter issues with profile updates:

1. **Check this guide** for common solutions
2. **Look at error messages** in the browser console
3. **Verify your database connection** status
4. **Contact support** with specific error details

## Technical Details

### Database Schema
- **Table**: `profiles`
- **Primary Key**: `id` (references `auth.users.id`)
- **Updated Field**: `updated_at` (automatically set)

### API Endpoints
- **GET**: `/profiles/:id` - Retrieve profile
- **PUT**: `/profiles/:id` - Update profile
- **POST**: `/profiles` - Create profile

### Data Flow
1. **Form submission** → Form validation
2. **Data cleaning** → Remove empty values
3. **API call** → Update database
4. **State update** → Refresh UI
5. **Success feedback** → Toast notification

---

**Last Updated**: August 2025
**Version**: 1.0
**Author**: KhelKheleko Development Team
