-- Chat System Setup Migration
-- This migration creates the necessary tables and policies for the tournament chat system

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE,
    team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
    sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    message text NOT NULL,
    message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system', 'announcement')),
    is_edited boolean DEFAULT false,
    edited_at timestamp with time zone,
    is_pinned boolean DEFAULT false,
    is_announcement boolean DEFAULT false,
    file_url text,
    file_name text,
    reactions jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_tournament_id ON public.chat_messages(tournament_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_team_id ON public.chat_messages(team_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

-- Enable Row Level Security
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chat_messages

-- Policy: Users can view messages for tournaments they're registered for or organizing
CREATE POLICY "Users can view tournament chat messages" ON public.chat_messages
    FOR SELECT USING (
        tournament_id IN (
            SELECT tr.tournament_id 
            FROM public.tournament_registrations tr 
            WHERE tr.player_id = auth.uid()
            UNION
            SELECT t.id 
            FROM public.tournaments t 
            WHERE t.organizer_id = auth.uid()
        )
    );

-- Policy: Users can insert messages for tournaments they're registered for or organizing
CREATE POLICY "Users can insert tournament chat messages" ON public.chat_messages
    FOR INSERT WITH CHECK (
        tournament_id IN (
            SELECT tr.tournament_id 
            FROM public.tournament_registrations tr 
            WHERE tr.player_id = auth.uid()
            UNION
            SELECT t.id 
            FROM public.tournaments t 
            WHERE t.organizer_id = auth.uid()
        )
        AND sender_id = auth.uid()
    );

-- Policy: Users can update their own messages
CREATE POLICY "Users can update own messages" ON public.chat_messages
    FOR UPDATE USING (sender_id = auth.uid());

-- Policy: Users can delete their own messages, organizers can delete any message in their tournament
CREATE POLICY "Users can delete own messages, organizers can delete any" ON public.chat_messages
    FOR DELETE USING (
        sender_id = auth.uid() 
        OR 
        tournament_id IN (
            SELECT t.id 
            FROM public.tournaments t 
            WHERE t.organizer_id = auth.uid()
        )
    );

-- Create storage bucket for chat files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-files', 'chat-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for chat files
CREATE POLICY "Chat files are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'chat-files');

-- Storage policy for authenticated users to upload chat files
CREATE POLICY "Authenticated users can upload chat files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'chat-files' 
        AND auth.role() = 'authenticated'
    );

-- Grant necessary permissions
GRANT ALL ON public.chat_messages TO authenticated;
GRANT USAGE ON SCHEMA storage TO authenticated;
