import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Image as ImageIcon, 
  FileText, 
  Smile,
  MoreVertical,
  Edit,
  Trash2,
  Users,
  MessageCircle,
  Bell,
  BellOff,
  Pin,
  PinOff,
  Volume2,
  VolumeX,
  Search,
  Filter,
  UserPlus,
  UserMinus,
  Shield,
  Crown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { chatService, profileService } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import toast from 'react-hot-toast';

interface TournamentOrganizerChatProps {
  tournamentId: string;
  tournamentName: string;
  organizerId: string;
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

interface ChatParticipant {
  id: string;
  full_name: string;
  avatar_url?: string;
  role: string;
  is_online: boolean;
  last_seen: string;
  is_muted: boolean;
  is_blocked: boolean;
}

export const TournamentOrganizerChat: React.FC<TournamentOrganizerChatProps> = ({
  tournamentId,
  tournamentName,
  organizerId,
  isEnabled,
  onClose
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'announcements' | 'pinned'>('all');
  const [showParticipants, setShowParticipants] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isOrganizer = user?.id === organizerId;
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isEnabled) {
      loadMessages();
      loadParticipants();
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
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        const updatedMessage = payload.new as ChatMessage;
        setMessages(prev => prev.map(msg => 
          msg.id === updatedMessage.id ? updatedMessage : msg
        ));
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        const deletedMessageId = payload.old.id;
        setMessages(prev => prev.filter(msg => msg.id !== deletedMessageId));
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

  const loadParticipants = async () => {
    try {
      // This would need to be implemented in the database service
      // For now, we'll use a placeholder
      const tournamentRegistrations = await supabase
        .from('tournament_registrations')
        .select(`
          player_id,
          profiles!inner (
            id,
            full_name,
            avatar_url,
            role
          )
        `)
        .eq('tournament_id', tournamentId);

      if (tournamentRegistrations.data) {
        const participantsList: ChatParticipant[] = tournamentRegistrations.data.map((reg: any) => ({
          id: reg.profiles.id,
          full_name: reg.profiles.full_name,
          avatar_url: reg.profiles.avatar_url,
          role: reg.profiles.role,
          is_online: false, // This would need real-time presence tracking
          last_seen: new Date().toISOString(),
          is_muted: false,
          is_blocked: false
        }));

        // Add organizer
        const organizerProfile = await profileService.getProfile(organizerId);
        if (organizerProfile) {
          participantsList.unshift({
            id: organizerProfile.id,
            full_name: organizerProfile.full_name,
            avatar_url: organizerProfile.avatar_url,
            role: 'organizer',
            is_online: true,
            last_seen: new Date().toISOString(),
            is_muted: false,
            is_blocked: false
          });
        }

        setParticipants(participantsList);
      }
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  };

  const sendMessage = async (messageType: 'text' | 'image' | 'file' | 'announcement' = 'text') => {
    if (!newMessage.trim() && messageType === 'text') return;

    console.log('🔍 Attempting to send message:', {
      tournamentId,
      senderId: user!.id,
      message: newMessage.trim(),
      messageType,
      isAnnouncement: messageType === 'announcement'
    });

    try {
      setSending(true);
      
      const messageData = {
        tournament_id: tournamentId,
        sender_id: user!.id,
        message: newMessage.trim(),
        message_type: messageType as 'text' | 'image' | 'file' | 'system' | 'announcement',
        is_announcement: messageType === 'announcement',
        is_edited: false,
        file_url: undefined as string | undefined,
        file_name: undefined as string | undefined
      };

      console.log('🔍 Message data prepared:', messageData);

      const sentMessage = await chatService.sendMessage(messageData);
      console.log('✅ Message sent successfully:', sentMessage);
      
      setMessages(prev => [sentMessage, ...prev]);
      setNewMessage('');
      
      if (messageType === 'announcement') {
        toast.success('Announcement sent to all participants!');
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
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
        message_type: 'file',
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

  const updateMessage = async (messageId: string) => {
    if (!editText.trim()) return;

    try {
      await chatService.updateMessage(messageId, { message: editText.trim() });
      setEditingMessage(null);
      setEditText('');
      toast.success('Message updated successfully!');
    } catch (error) {
      console.error('Error updating message:', error);
      toast.error('Failed to update message');
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await chatService.deleteMessage(messageId);
      toast.success('Message deleted successfully!');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const pinMessage = async (messageId: string) => {
    try {
      await chatService.updateMessage(messageId, { is_pinned: true });
      toast.success('Message pinned!');
    } catch (error) {
      console.error('Error pinning message:', error);
      toast.error('Failed to pin message');
    }
  };

  const unpinMessage = async (messageId: string) => {
    try {
      await chatService.updateMessage(messageId, { is_pinned: false });
      toast.success('Message unpinned!');
    } catch (error) {
      console.error('Error unpinning message:', error);
      toast.error('Failed to unpin message');
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

  const filteredMessages = messages.filter(message => {
    if (searchQuery && !message.message.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    if (filterType === 'announcements' && !message.is_announcement) {
      return false;
    }
    
    if (filterType === 'pinned' && !message.is_pinned) {
      return false;
    }
    
    return true;
  });

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
    <div className="flex h-[600px] bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowParticipants(!showParticipants)}
                className="text-white hover:bg-white/20"
              >
                <Users className="h-4 w-4" />
                <span className="ml-1">{participants.length}</span>
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

        {/* Search and Filter Bar */}
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Messages</option>
              <option value="announcements">Announcements</option>
              <option value="pinned">Pinned</option>
            </select>
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
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-2" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            filteredMessages.map((message) => (
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
                  
                  <div className={`relative group ${
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

                    {/* Message Actions */}
                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center space-x-1 bg-black bg-opacity-20 rounded p-1">
                        {(isOrganizer || message.sender_id === user?.id) && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingMessage(message.id);
                                setEditText(message.message);
                              }}
                              className="h-6 w-6 p-0 text-white hover:bg-white/20"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteMessage(message.id)}
                              className="h-6 w-6 p-0 text-white hover:bg-white/20"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        {isOrganizer && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => message.is_pinned ? unpinMessage(message.id) : pinMessage(message.id)}
                            className="h-6 w-6 p-0 text-white hover:bg-white/20"
                          >
                            {message.is_pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                          </Button>
                        )}
                      </div>
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
          {/* Edit Mode */}
          {editingMessage ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Edit your message..."
                onKeyPress={(e) => e.key === 'Enter' && updateMessage(editingMessage)}
              />
              <Button
                onClick={() => updateMessage(editingMessage)}
                disabled={!editText.trim()}
                size="sm"
              >
                Update
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingMessage(null);
                  setEditText('');
                }}
                size="sm"
              >
                Cancel
              </Button>
            </div>
          ) : (
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
              
              {isOrganizer && (
                <Button
                  onClick={() => sendMessage('announcement')}
                  variant="outline"
                  size="sm"
                  disabled={sending || !newMessage.trim()}
                  className="bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
                >
                  Announce
                </Button>
              )}
              
              <Button
                onClick={() => sendMessage()}
                disabled={sending || !newMessage.trim()}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}

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

      {/* Participants Sidebar */}
      {showParticipants && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 280, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          className="border-l border-gray-200 bg-gray-50 overflow-hidden"
        >
          <div className="p-4 border-b border-gray-200">
            <h4 className="font-semibold text-gray-900">Participants</h4>
            <p className="text-sm text-gray-600">{participants.length} members</p>
          </div>
          
          <div className="overflow-y-auto max-h-[500px]">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center space-x-3 p-3 hover:bg-gray-100 border-b border-gray-100"
              >
                <div className="relative">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    {participant.avatar_url ? (
                      <img 
                        src={participant.avatar_url} 
                        alt={participant.full_name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-600">
                        {participant.full_name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                    participant.is_online ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {participant.full_name}
                    </p>
                    {participant.role === 'organizer' && (
                      <Crown className="h-3 w-3 text-yellow-600" />
                    )}
                    {participant.role === 'admin' && (
                      <Shield className="h-3 w-3 text-blue-600" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 capitalize">
                    {participant.role}
                  </p>
                </div>
                
                {isOrganizer && participant.role !== 'organizer' && (
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Toggle mute functionality
                        toast.success(`${participant.full_name} ${participant.is_muted ? 'unmuted' : 'muted'}`);
                      }}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                    >
                      {participant.is_muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};
