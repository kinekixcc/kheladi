# 🗨️ Tournament Chat System

A comprehensive real-time chat system that enables organizers and players to communicate within tournaments.

## 🚀 Features

### For Organizers
- **Tournament Chat Management**: Centralized dashboard to manage all tournament chats
- **Announcement System**: Send important messages to all participants
- **Message Pinning**: Pin important messages for easy access
- **Participant Management**: View and manage chat participants
- **File Sharing**: Share documents, images, and other files
- **Real-time Notifications**: Instant message delivery with browser notifications
- **Chat Controls**: Mute/unmute participants, moderate conversations

### For Players
- **Real-time Messaging**: Instant communication with other participants
- **File Sharing**: Upload and share files with the tournament community
- **Message History**: Access to complete conversation history
- **Notification System**: Browser notifications for new messages
- **Responsive Design**: Works seamlessly on all devices

## 🏗️ Architecture

### Database Schema
```sql
-- Enhanced chat_messages table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system', 'announcement')),
    file_url TEXT,
    file_name TEXT,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_announcement BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Key Components
1. **TournamentOrganizerChat**: Full-featured chat for organizers
2. **TournamentPlayerChat**: Simplified chat for players
3. **OrganizerChatManager**: Dashboard for managing multiple tournament chats
4. **chatService**: Database operations for chat functionality

## 📱 Usage

### For Organizers

#### 1. Access Chat Management
- Navigate to Organizer Dashboard
- Click on the "Chat" tab
- View all tournaments with chat functionality

#### 2. Open Tournament Chat
- Click on any tournament card
- Access the full chat interface
- Send messages, announcements, and files

#### 3. Send Announcements
- Type your message
- Click the "Announce" button
- Message appears with special styling for all participants

#### 4. Pin Important Messages
- Hover over any message
- Click the pin icon to pin/unpin
- Pinned messages appear at the top of the chat

#### 5. Manage Participants
- Click the participants button to view all members
- Mute/unmute individual participants
- View participant roles and status

### For Players

#### 1. Access Tournament Chat
- Navigate to tournament details
- Look for the chat section
- Start participating in conversations

#### 2. Send Messages
- Type your message in the input field
- Press Enter or click Send
- Message appears instantly for all participants

#### 3. Share Files
- Click the file icon
- Select a file to upload
- File appears as a clickable link in the chat

## 🔧 Setup & Configuration

### 1. Database Migration
Run the chat system migration:
```sql
-- Execute chat_system_migration.sql in your Supabase SQL Editor
```

### 2. Storage Bucket
Create a storage bucket for chat files:
```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-files', 'chat-files', true) 
ON CONFLICT (id) DO NOTHING;
```

### 3. Environment Variables
Ensure your Supabase configuration is properly set:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Enable Chat for Tournaments
Set `chat_enabled: true` when creating tournaments or update existing ones:

**First, get a real tournament ID:**
```sql
-- Run this to see available tournaments
SELECT id, name, status, chat_enabled FROM tournaments ORDER BY created_at DESC LIMIT 5;
```

**Then enable chat for a specific tournament (replace 'ACTUAL_UUID_HERE' with the real ID):**
```sql
UPDATE tournaments 
SET chat_enabled = true 
WHERE id = 'ACTUAL_UUID_HERE';
```

**Example with a real UUID format:**
```sql
UPDATE tournaments 
SET chat_enabled = true 
WHERE id = '123e4567-e89b-12d3-a456-426614174000';
```

## 🛡️ Security & Permissions

### Row Level Security (RLS)
- **Chat Access**: Only tournament participants can view messages
- **Message Creation**: Users can only send messages to tournaments they're registered for
- **Message Editing**: Users can only edit their own messages
- **Announcements**: Only tournament organizers can send announcements
- **Message Pinning**: Only organizers can pin/unpin messages

### File Upload Security
- Files are stored in tournament-specific folders
- Access is restricted to tournament participants
- File size and type validation (configurable)

## 📊 Real-time Features

### Supabase Realtime
- **Instant Messaging**: Messages appear in real-time
- **Typing Indicators**: Shows when users are typing
- **Online Status**: Participant presence tracking
- **Message Updates**: Real-time message editing and deletion

### Browser Notifications
- **Permission Request**: Users can enable/disable notifications
- **Message Alerts**: Notifications for new messages
- **Announcement Highlights**: Special notifications for announcements

## 🎨 UI/UX Features

### Responsive Design
- **Mobile First**: Optimized for mobile devices
- **Desktop Enhanced**: Full-featured interface on larger screens
- **Touch Friendly**: Optimized for touch interactions

### Visual Elements
- **Message Bubbles**: Clear sender identification
- **Status Indicators**: Visual feedback for message states
- **Role Badges**: Organizer and admin identification
- **Pinned Messages**: Highlighted important content

### Accessibility
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: ARIA labels and descriptions
- **High Contrast**: Clear visual hierarchy
- **Focus Management**: Proper focus indicators

## 🔄 Integration Points

### Tournament System
- **Registration Integration**: Automatic participant access
- **Status Management**: Chat availability based on tournament state
- **Organizer Permissions**: Special privileges for tournament creators

### Notification System
- **Unified Notifications**: Integration with app-wide notification system
- **Email Notifications**: Optional email alerts for important messages
- **Push Notifications**: Mobile push notification support

### User Management
- **Profile Integration**: User avatars and information display
- **Role-based Access**: Different permissions for different user types
- **Privacy Settings**: User control over notification preferences

## 🚀 Future Enhancements

### Planned Features
- **Voice Messages**: Audio message support
- **Video Chat**: Real-time video communication
- **Chat Rooms**: Multiple topic-based channels
- **Message Reactions**: Emoji reactions to messages
- **Chat Analytics**: Message statistics and insights
- **Moderation Tools**: Advanced content filtering
- **Chat Bots**: Automated responses and assistance

### Performance Optimizations
- **Message Pagination**: Load messages in chunks
- **Image Compression**: Automatic image optimization
- **Offline Support**: Message queuing when offline
- **Caching**: Intelligent message caching

## 🐛 Troubleshooting

### Common Issues

#### 1. Chat Not Loading
- Check database connection
- Verify RLS policies are correct
- Ensure user has tournament access

#### 2. Messages Not Sending
- Check user permissions
- Verify tournament chat is enabled
- Check browser console for errors

#### 3. File Upload Failures
- Verify storage bucket exists
- Check file size limits
- Ensure proper storage permissions

#### 4. Real-time Not Working
- Check Supabase realtime configuration
- Verify channel subscriptions
- Check network connectivity

#### 5. UUID Format Error
- **Error**: `ERROR: 22P02: invalid input syntax for type uuid: "your_tournament_id"`
- **Cause**: Using placeholder text instead of real UUID
- **Solution**: 
  1. Run the SELECT query above to get real tournament IDs
  2. Replace placeholder with actual UUID (e.g., `'123e4567-e89b-12d3-a456-426614174000'`)
  3. UUIDs must be in the format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### Debug Mode
Enable debug logging in the browser console:
```javascript
localStorage.setItem('chat_debug', 'true');
```

## 📚 API Reference

### Chat Service Methods

#### `sendMessage(messageData)`
Send a new message to a tournament.

#### `getTournamentMessages(tournamentId, limit)`
Retrieve messages for a specific tournament.

#### `updateMessage(messageId, updates)`
Update an existing message.

#### `deleteMessage(messageId)`
Delete a message.

### Message Types
- `text`: Regular text message
- `image`: Image file message
- `file`: Document or other file
- `system`: System-generated message
- `announcement`: Organizer announcement

## 🤝 Contributing

### Development Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run the database migrations
5. Start development server: `npm run dev`

### Code Style
- Follow TypeScript best practices
- Use functional components with hooks
- Implement proper error handling
- Add comprehensive testing

## 📄 License

This chat system is part of the Tournament Management Platform and follows the same licensing terms.

## 🆘 Support

For technical support or feature requests:
- Create an issue in the repository
- Contact the development team
- Check the documentation wiki

---

**Happy Chatting! 🎉**
