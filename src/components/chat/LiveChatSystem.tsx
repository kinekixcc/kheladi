import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Image as ImageIcon, 
  FileText, 
  Smile,
  MoreVertical,
  Edit,
  Trash2,
  Paperclip,
  Video,
  Mic,
  Phone,
  PhoneOff,
  Volume2,
  VolumeX,
  Settings,
  UserPlus,
  Users,
  Lock,
  Unlock,
  Shield,
  Crown,
  Star,
  Heart,
  ThumbsUp,
  MessageCircle,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  EyeOff,
  Download,
  Play,
  Pause,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { chatService } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import toast from 'react-hot-toast';

interface LiveChatSystemProps {
  tournamentId: string;
  teamId?: string;
  isEnabled: boolean;
  isHost?: boolean;
  isModerator?: boolean;
  maxParticipants?: number;
  currentParticipants?: number;
  entryFee?: number;
  currency?: string;
}

interface ChatMessage {
  id: string;
  message: string;
  message_type: 'text' | 'image' | 'file' | 'video' | 'audio' | 'system' | 'payment' | 'join' | 'leave';
  sender_id: string;
  sender?: {
    full_name: string;
    avatar_url?: string;
    role?: string;
    is_verified?: boolean;
  };
  created_at: string;
  is_edited?: boolean;
  edited_at?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  thumbnail_url?: string;
  duration?: number; // for audio/video
  reactions?: MessageReaction[];
  reply_to?: string;
  is_pinned?: boolean;
  is_announcement?: boolean;
}

interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
}

interface TypingUser {
  id: string;
  name: string;
  timestamp: number;
}

export const LiveChatSystem: React.FC<LiveChatSystemProps> = ({
  tournamentId,
  teamId,
  isEnabled,
  isHost = false,
  isModerator = false,
  maxParticipants = 50,
  currentParticipants = 0,
  entryFee = 0,
  currency = '₹'
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showVoiceMessage, setShowVoiceMessage] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [chatTheme, setChatTheme] = useState<'light' | 'dark' | 'auto'>('auto');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [autoScroll, setAutoScroll] = useState(true);
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMessages, setFilteredMessages] = useState<ChatMessage[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { staggerChildren: 0.1 }
    }
  };

  const messageVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { type: "spring", stiffness: 100 }
    },
    exit: { opacity: 0, x: 20 }
  };

  const typingVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { type: "spring", stiffness: 200 }
    }
  };

  useEffect(() => {
    if (isEnabled) {
      loadMessages();
      setupRealtimeSubscription();
      setupTypingSubscription();
    }
    
    return () => {
      cleanupSubscriptions();
    };
  }, [tournamentId, teamId, isEnabled]);

  useEffect(() => {
    if (autoScroll) {
      scrollToBottom();
    }
  }, [messages, autoScroll]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = messages.filter(msg => 
        msg.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.sender?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMessages(filtered);
    } else {
      setFilteredMessages(messages);
    }
  }, [searchQuery, messages]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`live-chat:${tournamentId}:${teamId || 'general'}`)
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
        
        // Show notification for new messages
        if (newMessage.sender_id !== user?.id) {
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

    return channel;
  };

  const setupTypingSubscription = () => {
    const channel = supabase
      .channel(`typing:${tournamentId}:${teamId || 'general'}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { userId, userName, isTyping: userTyping } = payload.payload;
        
        if (userId !== user?.id) {
          if (userTyping) {
            setTypingUsers(prev => {
              const existing = prev.find(u => u.id === userId);
              if (existing) {
                return prev.map(u => u.id === userId ? { ...u, timestamp: Date.now() } : u);
              }
              return [...prev, { id: userId, name: userName, timestamp: Date.now() }];
            });
          } else {
            setTypingUsers(prev => prev.filter(u => u.id !== userId));
          }
        }
      })
      .subscribe();

    return channel;
  };

  const cleanupSubscriptions = () => {
    supabase.removeChannel(`live-chat:${tournamentId}:${teamId || 'general'}`);
    supabase.removeChannel(`typing:${tournamentId}:${teamId || 'general'}`);
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const chatMessages = teamId 
        ? await chatService.getTeamMessages(teamId, 100)
        : await chatService.getTournamentMessages(tournamentId, 100);
      
      setMessages(chatMessages.reverse());
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

  const handleTyping = useCallback((isUserTyping: boolean) => {
    setIsTyping(isUserTyping);
    
    if (isUserTyping) {
      // Broadcast typing status
      supabase.channel(`typing:${tournamentId}:${teamId || 'general'}`).send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: user?.id, userName: user?.full_name, isTyping: true }
      });
    } else {
      // Broadcast stopped typing
      supabase.channel(`typing:${tournamentId}:${teamId || 'general'}`).send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: user?.id, userName: user?.full_name, isTyping: false }
      });
    }

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    if (isUserTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        supabase.channel(`typing:${tournamentId}:${teamId || 'general'}`).send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId: user?.id, userName: user?.full_name, isTyping: false }
        });
      }, 3000);
    }
  }, [tournamentId, teamId, user?.id, user?.full_name]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setSending(true);
    try {
      const messageData = {
        tournament_id: tournamentId,
        team_id: teamId,
        sender_id: user.id,
        message: newMessage.trim(),
        message_type: 'text' as const,
        reply_to: replyToMessage?.id
      };

      await chatService.sendMessage(messageData);
      setNewMessage('');
      setReplyToMessage(null);
      handleTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!user) return;

    try {
      setSending(true);
      
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `chat-files/${tournamentId}/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat-files')
        .getPublicUrl(filePath);

      // Determine message type
      let messageType: ChatMessage['message_type'] = 'file';
      if (file.type.startsWith('image/')) messageType = 'image';
      else if (file.type.startsWith('video/')) messageType = 'video';
      else if (file.type.startsWith('audio/')) messageType = 'audio';

      // Create thumbnail for images/videos
      let thumbnailUrl = '';
      if (messageType === 'image' || messageType === 'video') {
        thumbnailUrl = publicUrl;
      }

      const messageData = {
        tournament_id: tournamentId,
        team_id: teamId,
        sender_id: user.id,
        message: file.name,
        message_type: messageType,
        file_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        thumbnail_url: thumbnailUrl
      };

      await chatService.sendMessage(messageData);
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setSending(false);
      setShowFileUpload(false);
    }
  };

  const handleVoiceMessage = async () => {
    if (!user) return;

    try {
      if (!isRecording) {
        // Start recording
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          const audioFile = new File([audioBlob], 'voice-message.wav', { type: 'audio/wav' });
          await handleFileUpload(audioFile);
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
      } else {
        // Stop recording
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
      }
    } catch (error) {
      console.error('Error with voice recording:', error);
      toast.error('Failed to record voice message');
    }
  };

  const handleEditMessage = async (messageId: string) => {
    if (!editText.trim()) return;

    try {
      await chatService.updateMessage(messageId, { message: editText.trim() });
      setEditingMessage(null);
      setEditText('');
      toast.success('Message updated');
    } catch (error) {
      console.error('Error updating message:', error);
      toast.error('Failed to update message');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!user) return;

    try {
      await chatService.deleteMessage(messageId);
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    try {
      // Update message reactions
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      const currentReactions = message.reactions || [];
      const existingReaction = currentReactions.find(r => r.emoji === emoji);
      
      let updatedReactions;
      if (existingReaction) {
        if (existingReaction.users.includes(user.id)) {
          // Remove user's reaction
          updatedReactions = currentReactions.map(r => 
            r.emoji === emoji 
              ? { ...r, count: r.count - 1, users: r.users.filter(u => u !== user.id) }
              : r
          ).filter(r => r.count > 0);
        } else {
          // Add user's reaction
          updatedReactions = currentReactions.map(r => 
            r.emoji === emoji 
              ? { ...r, count: r.count + 1, users: [...r.users, user.id] }
              : r
          );
        }
      } else {
        // Create new reaction
        updatedReactions = [...currentReactions, { emoji, count: 1, users: [user.id] }];
      }

      await chatService.updateMessage(messageId, { reactions: updatedReactions });
    } catch (error) {
      console.error('Error updating reaction:', error);
      toast.error('Failed to update reaction');
    }
  };

  const showMessageNotification = (message: ChatMessage) => {
    if (document.hidden) {
      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`New message from ${message.sender?.full_name}`, {
          body: message.message,
          icon: '/favicon.ico'
        });
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (!isEnabled) {
    return (
      <Card className="p-6 text-center">
        <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Chat is disabled for this tournament</p>
      </Card>
    );
  }

  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Button
          onClick={() => setIsMinimized(false)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-16 h-16 shadow-lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative"
    >
      <Card className="bg-white shadow-xl border-0">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageCircle className="h-5 w-5" />
              <div>
                <h3 className="font-semibold">Live Chat</h3>
                <p className="text-sm text-blue-100">
                  {teamId ? 'Team Chat' : 'Tournament Chat'} • {currentParticipants} participants
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowParticipants(!showParticipants)}
                className="text-white hover:bg-white/20"
              >
                <Users className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMuted(!isMuted)}
                className="text-white hover:bg-white/20"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="text-white hover:bg-white/20"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(true)}
                className="text-white hover:bg-white/20"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="h-96 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading messages...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No messages yet</p>
              <p className="text-sm text-gray-500 mt-2">Start the conversation!</p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredMessages.map((message) => (
                <motion.div
                  key={message.id}
                  variants={messageVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md ${message.sender_id === user?.id ? 'order-2' : 'order-1'}`}>
                    {message.sender_id !== user?.id && (
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium">
                          {message.sender?.full_name?.charAt(0) || 'U'}
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {message.sender?.full_name || 'Unknown User'}
                        </span>
                        {message.sender?.is_verified && (
                          <Shield className="h-3 w-3 text-blue-500" />
                        )}
                        {message.is_announcement && (
                          <Crown className="h-3 w-3 text-yellow-500" />
                        )}
                      </div>
                    )}
                    
                    <div className={`p-3 rounded-lg ${
                      message.sender_id === user?.id
                        ? 'bg-blue-600 text-white'
                        : message.is_announcement
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        : message.message_type === 'system'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {replyToMessage && (
                        <div className="mb-2 p-2 bg-black/10 rounded text-sm">
                          <p className="font-medium">Replying to {replyToMessage.sender?.full_name}</p>
                          <p className="truncate">{replyToMessage.message}</p>
                        </div>
                      )}
                      
                      {message.message_type === 'image' && message.thumbnail_url && (
                        <div className="mb-2">
                          <img 
                            src={message.thumbnail_url} 
                            alt="Shared image" 
                            className="rounded max-w-full cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => window.open(message.thumbnail_url, '_blank')}
                          />
                        </div>
                      )}
                      
                      {message.message_type === 'file' && (
                        <div className="mb-2 p-2 bg-black/10 rounded flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{message.file_name}</p>
                            <p className="text-xs opacity-75">{formatFileSize(message.file_size || 0)}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(message.file_url, '_blank')}
                            className="text-xs"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      
                      {message.message_type === 'video' && message.thumbnail_url && (
                        <div className="mb-2 relative">
                          <img 
                            src={message.thumbnail_url} 
                            alt="Video thumbnail" 
                            className="rounded max-w-full"
                          />
                          <Button
                            size="sm"
                            className="absolute inset-0 m-auto bg-black/50 hover:bg-black/70 text-white"
                            onClick={() => window.open(message.file_url, '_blank')}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      
                      {message.message_type === 'audio' && (
                        <div className="mb-2 p-2 bg-black/10 rounded flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <Play className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">Voice Message</p>
                            <p className="text-xs opacity-75">
                              {message.duration ? formatDuration(message.duration) : 'Unknown duration'}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <p className="text-sm">{message.message}</p>
                      
                      <div className="flex items-center justify-between mt-2 text-xs opacity-75">
                        <span>{getMessageTime(message.created_at)}</span>
                        {message.is_edited && <span>(edited)</span>}
                      </div>
                      
                      {/* Message Actions */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-1">
                          {message.reactions?.map((reaction) => (
                            <button
                              key={reaction.emoji}
                              onClick={() => handleReaction(message.id, reaction.emoji)}
                              className={`px-2 py-1 rounded-full text-xs ${
                                reaction.users.includes(user?.id || '')
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {reaction.emoji} {reaction.count}
                            </button>
                          ))}
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setReplyToMessage(message)}
                            className="p-1 hover:bg-black/10 rounded text-xs opacity-75 hover:opacity-100"
                          >
                            Reply
                          </button>
                          
                          {(message.sender_id === user?.id || isHost || isModerator) && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingMessage(message.id);
                                  setEditText(message.message);
                                }}
                                className="p-1 hover:bg-black/10 rounded text-xs opacity-75 hover:opacity-100"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteMessage(message.id)}
                                className="p-1 hover:bg-red-100 text-red-600 rounded text-xs opacity-75 hover:opacity-100"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          
          {/* Typing Indicator */}
          <AnimatePresence>
            {typingUsers.length > 0 && (
              <motion.div
                variants={typingVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="flex items-center space-x-2 text-gray-500 text-sm italic"
              >
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span>{typingUsers.map(u => u.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div ref={messagesEndRef} />
        </div>

        {/* Reply Preview */}
        {replyToMessage && (
          <div className="px-4 py-2 bg-blue-50 border-t border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-blue-600">Replying to {replyToMessage.sender?.full_name}</span>
                <span className="text-xs text-blue-500 truncate">{replyToMessage.message}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setReplyToMessage(null)}
                className="text-blue-600 hover:text-blue-700"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping(e.target.value.length > 0);
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type your message..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={1}
                disabled={sending}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-gray-500 hover:text-gray-700"
              >
                <Smile className="h-4 w-4" />
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowFileUpload(!showFileUpload)}
                className="text-gray-500 hover:text-gray-700"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={handleVoiceMessage}
                className={`${isRecording ? 'text-red-500' : 'text-gray-500'} hover:text-gray-700`}
              >
                <Mic className="h-4 w-4" />
              </Button>
              
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          {/* File Upload Options */}
          <AnimatePresence>
            {showFileUpload && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    className="hidden"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => imageInputRef.current?.click()}
                    className="flex items-center space-x-2"
                  >
                    <ImageIcon className="h-4 w-4" />
                    <span>Image</span>
                  </Button>
                  
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    className="hidden"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => videoInputRef.current?.click()}
                    className="flex items-center space-x-2"
                  >
                    <Video className="h-4 w-4" />
                    <span>Video</span>
                  </Button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    className="hidden"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>File</span>
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      {/* Participants Panel */}
      <AnimatePresence>
        {showParticipants && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute right-0 top-0 w-80 bg-white shadow-xl border-l border-gray-200 h-full"
          >
            <div className="p-4 border-b border-gray-200">
              <h4 className="font-semibold text-gray-900">Participants ({currentParticipants}/{maxParticipants})</h4>
            </div>
            <div className="p-4">
              {/* Participant list would go here */}
              <p className="text-gray-500 text-sm">Participant list coming soon...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute right-0 top-0 w-80 bg-white shadow-xl border-l border-gray-200 h-full"
          >
            <div className="p-4 border-b border-gray-200">
              <h4 className="font-semibold text-gray-900">Chat Settings</h4>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                <select
                  value={chatTheme}
                  onChange={(e) => setChatTheme(e.target.value as any)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="auto">Auto</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value as any)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Auto-scroll</label>
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
