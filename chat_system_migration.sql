-- Chat System Enhancement Migration
-- This migration adds new fields to support enhanced chat functionality

-- Add new columns to chat_messages table
DO $$
BEGIN
    -- Add file_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'file_name') THEN
        ALTER TABLE public.chat_messages ADD COLUMN file_name TEXT;
        RAISE NOTICE 'Added file_name column to chat_messages table';
    END IF;
    
    -- Add is_pinned column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'is_pinned') THEN
        ALTER TABLE public.chat_messages ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_pinned column to chat_messages table';
    END IF;
    
    -- Add is_announcement column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'is_announcement') THEN
        ALTER TABLE public.chat_messages ADD COLUMN is_announcement BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_announcement column to chat_messages table';
    END IF;
    
    -- Update message_type check constraint to include 'announcement'
    IF EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'chat_messages_message_type_check') THEN
        ALTER TABLE public.chat_messages DROP CONSTRAINT chat_messages_message_type_check;
    END IF;
    
    ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_message_type_check 
    CHECK (message_type IN ('text', 'image', 'file', 'system', 'announcement'));
    
    RAISE NOTICE 'Updated message_type check constraint to include announcement';
END $$;

-- Create storage bucket for chat files if it doesn't exist
-- Note: This needs to be run in Supabase dashboard or via API
-- INSERT INTO storage.buckets (id, name, public) VALUES ('chat-files', 'chat-files', true)
-- ON CONFLICT (id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_pinned ON public.chat_messages(is_pinned);
CREATE INDEX IF NOT EXISTS idx_chat_messages_announcement ON public.chat_messages(is_announcement);
CREATE INDEX IF NOT EXISTS idx_chat_messages_tournament_sender ON public.chat_messages(tournament_id, sender_id);

-- Update RLS policies to allow reading chat messages for tournament participants
DROP POLICY IF EXISTS "Chat messages are viewable by tournament participants" ON public.chat_messages;

CREATE POLICY "Chat messages are viewable by tournament participants" ON public.chat_messages
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM tournament_registrations tr 
        WHERE tr.tournament_id = chat_messages.tournament_id 
        AND tr.player_id = auth.uid()
    ) OR 
    EXISTS (
        SELECT 1 FROM tournaments t 
        WHERE t.id = chat_messages.tournament_id 
        AND t.organizer_id = auth.uid()
    )
);

-- Allow tournament organizers to send announcements
CREATE POLICY "Organizers can send announcements" ON public.chat_messages
FOR INSERT WITH CHECK (
    message_type = 'announcement' AND
    EXISTS (
        SELECT 1 FROM tournaments t 
        WHERE t.id = chat_messages.tournament_id 
        AND t.organizer_id = auth.uid()
    )
);

-- Allow organizers to pin/unpin messages
CREATE POLICY "Organizers can pin messages" ON public.chat_messages
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM tournaments t 
        WHERE t.id = chat_messages.tournament_id 
        AND t.organizer_id = auth.uid()
    )
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Chat system enhancement migration completed successfully!';
    RAISE NOTICE 'New features added:';
    RAISE NOTICE '- File name support for file messages';
    RAISE NOTICE '- Message pinning functionality';
    RAISE NOTICE '- Announcement message type';
    RAISE NOTICE '- Enhanced RLS policies for tournament participants';
END $$;
