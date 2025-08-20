import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Send, 
  FileText, 
  MessageCircle,
  Pin,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { chatService } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import toast from 'react-hot-toast';

interface TournamentPlayerChatProps {
  tournamentId: string;
  tournamentName: string;
  isEnabled: boolean;
  onClose?: () => void;
}

interface ChatMessage {
  id: string;
  message: string;
  message_type: 'text' | 'image' | 'file' | 'system' | 'announcement';
  sender_id: string;
  sender?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    role?: string;
  };
  created_at: string;
  is_edited?: boolean;
  edited_at?: string;
  is_pinned?: boolean;
  is_announcement?: boolean;
  file_url?: string;
  file_name?: string;
}

export const TournamentPlayerChat: React.FC<TournamentPlayerChatProps> = ({
  tournamentId,
  tournamentName,
  isEnabled,
  onClose
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEnabled) {
      loadMessages();
      setupRealtimeSubscription();
    }
  }, [tournamentId, isEnabled]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`tournament-chat:${tournamentId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `tournament_id=eq.${tournamentId}`
      }, (payload) => {
        const newMessage = payload.new as ChatMessage;
        setMessages(prev => [newMessage, ...prev]);
        
        // Show notification for new messages if not muted
        if (newMessage.sender_id !== user?.id && !isMuted) {
          showMessageNotification(newMessage);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const chatMessages = await chatService.getTournamentMessages(tournamentId, 100);
      setMessages(chatMessages.reverse());
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load chat messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      
      const messageData = {
        tournament_id: tournamentId,
        sender_id: user!.id,
        message: newMessage.trim(),
        message_type: 'text' as const,
        is_edited: false
      };

      const sentMessage = await chatService.sendMessage(messageData);
      setMessages(prev => [sentMessage, ...prev]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const sendFileMessage = async (file: File) => {
    try {
      setSending(true);
      
      // Upload file to Supabase storage
      const fileName = `${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(`tournament-${tournamentId}/${fileName}`, file);

      if (uploadError) throw uploadError;

      const fileUrl = supabase.storage
        .from('chat-files')
        .getPublicUrl(`tournament-${tournamentId}/${fileName}`).data.publicUrl;

      const messageData = {
        tournament_id: tournamentId,
        sender_id: user!.id,
        message: `File: ${file.name}`,
        message_type: 'file' as const,
        is_edited: false,
        file_url: fileUrl,
        file_name: file.name
      };

      const sentMessage = await chatService.sendMessage(messageData);
      setMessages(prev => [sentMessage, ...prev]);
      
      toast.success('File sent successfully!');
    } catch (error) {
      console.error('Error sending file:', error);
      toast.error('Failed to send file');
    } finally {
      setSending(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    toast.success(isMuted ? 'Chat unmuted' : 'Chat muted');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const showMessageNotification = (message: ChatMessage) => {
    if (Notification.permission === 'granted') {
      new Notification(`New message from ${message.sender?.full_name}`, {
        body: message.message,
        icon: '/favicon.ico'
      });
    }
  };

  const pinnedMessages = messages.filter(msg => msg.is_pinned);
  const announcementMessages = messages.filter(msg => msg.is_announcement);

  if (!isEnabled) {
    return (
      <Card className="p-6 text-center">
        <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Chat Disabled</h3>
        <p className="text-gray-600">Chat functionality is not enabled for this tournament.</p>
      </Card>
    );
  }

  return (
    <div className="h-[500px] bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageCircle className="h-6 w-6" />
            <div>
              <h3 className="font-semibold">{tournamentName}</h3>
              <p className="text-sm text-blue-100">Tournament Chat</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              className="text-white hover:bg-white/20"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                ×
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Pinned Messages */}
      {pinnedMessages.length > 0 && (
        <div className="p-3 border-b border-gray-200 bg-yellow-50">
          <div className="flex items-center space-x-2 mb-2">
            <Pin className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">Pinned Messages</span>
          </div>
          {pinnedMessages.map(message => (
            <div key={message.id} className="text-sm text-yellow-700 bg-yellow-100 p-2 rounded mb-1">
              <strong>{message.sender?.full_name}:</strong> {message.message}
            </div>
          ))}
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-2" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md ${message.sender_id === user?.id ? 'order-2' : 'order-1'}`}>
                {message.sender_id !== user?.id && (
                  <div className="text-xs text-gray-500 mb-1 ml-2">
                    {message.sender?.full_name}
                    {message.is_announcement && (
                      <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                        ANNOUNCEMENT
                      </span>
                    )}
                  </div>
                )}
                
                <div className={`relative ${
                  message.sender_id === user?.id 
                    ? 'bg-blue-600 text-white' 
                    : message.is_announcement 
                      ? 'bg-red-100 text-red-900 border border-red-300'
                      : 'bg-gray-100 text-gray-900'
                } rounded-lg px-3 py-2 ${message.is_pinned ? 'ring-2 ring-yellow-400' : ''}`}>
                  
                  {message.is_pinned && (
                    <Pin className="h-3 w-3 text-yellow-600 absolute -top-1 -left-1" />
                  )}
                  
                  {message.message_type === 'file' ? (
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <a 
                        href={message.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="underline hover:no-underline"
                      >
                        {message.file_name}
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm">{message.message}</p>
                  )}
                  
                  <div className="text-xs opacity-70 mt-1">
                    {new Date(message.created_at).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                    {message.is_edited && ' (edited)'}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Type your message..."
            disabled={sending}
          />
          
          <Button
            onClick={() => setShowFileUpload(!showFileUpload)}
            variant="outline"
            size="sm"
            disabled={sending}
          >
            <FileText className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={sendMessage}
            disabled={sending || !newMessage.trim()}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* File Upload */}
        {showFileUpload && (
          <div className="mt-3 p-3 border border-gray-300 rounded-lg bg-gray-50">
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  sendFileMessage(file);
                  setShowFileUpload(false);
                }
              }}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Choose File to Upload
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
