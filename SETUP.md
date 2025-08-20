# Setup Guide for KhelKheleko

## Environment Configuration

To run the application properly, you need to configure the following environment variables:

### 1. Create a `.env` file in the project root

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Get Your Supabase Credentials

1. Go to [Supabase](https://supabase.com) and sign in
2. Create a new project or select an existing one
3. Go to Settings > API
4. Copy the following values:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Anon Public Key** → `VITE_SUPABASE_ANON_KEY`

### 3. Example `.env` file

```bash
VITE_SUPABASE_URL=https://eiwttgmiihprapodycrka.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpd3R0Z21paHByYXBvZHljcmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MDYyNTcsImV4cCI6MjA2OTE4MjI1N30.Ow0L3qpbyjzAnadfX8rdMmO3HyJ0LOTZM1R9q09qmUE
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Electron Mode
```bash
npm run electron:dev
```

## Troubleshooting

### Profile Updates Not Working
If players can't save changes to their profile:

1. **Check Environment Variables**: Ensure `.env` file exists and has correct values
2. **Restart Application**: After updating `.env`, restart the development server
3. **Check Console**: Look for database connection errors in browser console
4. **Verify Supabase**: Ensure your Supabase project is active and accessible

### Database Connection Issues
- Verify your Supabase project is not paused
- Check if the API keys are correct
- Ensure your IP is not blocked by Supabase

### Common Error Messages
- `"Supabase not configured"` → Missing or incorrect environment variables
- `"Database connection issue"` → Check Supabase project status
- `"Failed to update profile"` → Database permissions or connection issue

## Support

If you continue to have issues:
1. Check the browser console for error messages
2. Verify your Supabase project settings
3. Ensure all environment variables are set correctly
4. Restart the development server after making changes
