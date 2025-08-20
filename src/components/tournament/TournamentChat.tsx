import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Image as ImageIcon, 
  FileText, 
  Smile,
  MoreVertical,
  Edit,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { chatService } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import toast from 'react-hot-toast';

interface TournamentChatProps {
  tournamentId: string;
  teamId?: string;
  isEnabled: boolean;
}

interface ChatMessage {
  id: string;
  message: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  sender_id: string;
  sender?: {
    full_name: string;
    avatar_url?: string;
  };
  created_at: string;
  is_edited?: boolean;
  edited_at?: string;
}

export const TournamentChat: React.FC<TournamentChatProps> = ({
  tournamentId,
  teamId,
  isEnabled
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEnabled) {
      loadMessages();
      // Set up real-time subscription for new messages
      const channel = supabase
        .channel(`chat:${tournamentId}:${teamId || 'general'}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: teamId 
            ? `tournament_id=eq.${tournamentId} AND team_id=eq.${teamId}`
            : `tournament_id=eq.${tournamentId} AND team_id IS NULL`
        }, (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => [newMessage, ...prev]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [tournamentId, teamId, isEnabled]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const chatMessages = teamId 
        ? await chatService.getTeamMessages(teamId, 50)
        : await chatService.getTournamentMessages(tournamentId, 50);
      
      setMessages(chatMessages.reverse()); // Show newest at bottom
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load chat messages');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setSending(true);
    try {
      const messageData = {
        tournament_id: tournamentId,
        team_id: teamId,
        sender_id: user.id,
        message: newMessage.trim(),
        message_type: 'text' as const
      };

      await chatService.sendMessage(messageData);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleEditMessage = async (messageId: string) => {
    if (!editText.trim()) return;

    try {
      await chatService.updateMessage(messageId, { message: editText.trim() });
      setEditingMessage(null);
      setEditText('');
      toast.success('Message updated');
      loadMessages(); // Reload to get updated message
    } catch (error) {
      console.error('Error updating message:', error);
      toast.error('Failed to update message');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      await chatService.deleteMessage(messageId);
      toast.success('Message deleted');
      loadMessages(); // Reload to remove deleted message
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB');
      return;
    }

    setSending(true);
    try {
      // Convert file to base64 for storage (in production, upload to cloud storage)
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const messageData = {
        tournament_id: tournamentId,
        team_id: teamId,
        sender_id: user?.id!,
        message: file.name,
        message_type: file.type.startsWith('image/') ? 'image' : 'file' as const,
        file_url: base64
      };

      await chatService.sendMessage(messageData);
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const canEditMessage = (message: ChatMessage) => {
    return message.sender_id === user?.id && message.message_type === 'text';
  };

  const canDeleteMessage = (message: ChatMessage) => {
    return message.sender_id === user?.id;
  };

  if (!isEnabled) {
    return (
      <Card className="p-6 text-center">
        <div className="text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p>Chat is disabled for this tournament</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-96 flex flex-col">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          {teamId ? 'Team Chat' : 'Tournament Chat'}
        </h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => imageInputRef.current?.click()}
            disabled={sending}
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
          >
            <FileText className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="text-center text-gray-500">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500">
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md ${message.sender_id === user?.id ? 'order-2' : 'order-1'}`}>
                  {message.sender_id !== user?.id && (
                    <div className="text-xs text-gray-500 mb-1">
                      {message.sender?.full_name || 'Unknown User'}
                    </div>
                  )}
                  
                  <div className={`rounded-lg px-3 py-2 ${
                    message.sender_id === user?.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    {editingMessage === message.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full p-2 text-sm border rounded resize-none"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleEditMessage(message.id)}
                            className="text-xs"
                          >
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingMessage(null);
                              setEditText('');
                            }}
                            className="text-xs"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {message.message_type === 'image' ? (
                          <img
                            src={message.file_url}
                            alt="Shared image"
                            className="max-w-full rounded cursor-pointer hover:opacity-80"
                            onClick={() => window.open(message.file_url, '_blank')}
                          />
                        ) : message.message_type === 'file' ? (
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4" />
                            <a
                              href={message.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline hover:no-underline"
                            >
                              {message.message}
                            </a>
                          </div>
                        ) : (
                          <p className="text-sm">{message.message}</p>
                        )}
                        
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs opacity-70">
                            {formatTime(message.created_at)}
                            {message.is_edited && ' (edited)'}
                          </span>
                          
                          {(canEditMessage(message) || canDeleteMessage(message)) && (
                            <div className="flex items-center space-x-1">
                              {canEditMessage(message) && (
                                <button
                                  onClick={() => {
                                    setEditingMessage(message.id);
                                    setEditText(message.message);
                                  }}
                                  className="text-xs opacity-70 hover:opacity-100"
                                >
                                  <Edit className="h-3 w-3" />
                                </button>
                              )}
                              {canDeleteMessage(message) && (
                                <button
                                  onClick={() => handleDeleteMessage(message.id)}
                                  className="text-xs opacity-70 hover:opacity-100 text-red-500"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={sending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            loading={sending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        onChange={handleFileUpload}
        className="hidden"
      />
    </Card>
  );
};
