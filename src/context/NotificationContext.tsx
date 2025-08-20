import React, { createContext, useContext, useState, useEffect } from 'react';
import { notificationService } from '../lib/database';
import { realtimeManager } from '../lib/realtime';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

export interface Notification {
  id: string;
  type: 'tournament_submitted' | 'tournament_approved' | 'tournament_rejected' | 'new_tournament_available' | 'tournament_registration_success';
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  userId?: string;
  tournamentId?: string;
  tournamentName?: string;
  targetRole?: 'admin' | 'organizer' | 'player' | 'all';
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'created_at' | 'read'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();
  const [realtimeUnsubscribe, setRealtimeUnsubscribe] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (user) {
      loadNotifications();
      setupRealtimeSubscription();
    } else {
      setNotifications([]);
      cleanupRealtimeSubscription();
    }
    
    return () => {
      cleanupRealtimeSubscription();
    };
  }, [user]);

  const setupRealtimeSubscription = () => {
    if (!user) return;
    
    // Clean up existing subscription
    cleanupRealtimeSubscription();
    
    // Set up new subscription
    const unsubscribe = realtimeManager.subscribeNotificationUpdates(
      user.id,
      (payload) => {
        console.log('Real-time notification received:', payload);
        
        if (payload.eventType === 'INSERT' && payload.new) {
          const newNotification: Notification = {
            id: payload.new.id,
            type: payload.new.type,
            title: payload.new.title,
            message: payload.new.message,
            created_at: payload.new.created_at,
            read: payload.new.read,
            userId: payload.new.user_id,
            tournamentId: payload.new.tournament_id,
            tournamentName: payload.new.tournament_name,
            targetRole: payload.new.target_role
          };
          
          setNotifications(prev => [newNotification, ...prev]);
          
          // Show toast notification
          toast.success(newNotification.title, {
            duration: 4000,
            position: 'top-right'
          });
        }
      }
    );
    
    setRealtimeUnsubscribe(() => unsubscribe);
  };

  const cleanupRealtimeSubscription = () => {
    if (realtimeUnsubscribe) {
      realtimeUnsubscribe();
      setRealtimeUnsubscribe(null);
    }
  };
  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      const data = await notificationService.getUserNotifications(user.id, user.role);
      setNotifications(data.map(notification => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        created_at: notification.created_at,
        read: notification.read,
        userId: notification.user_id,
        tournamentId: notification.tournament_id,
        tournamentName: notification.tournament_name,
        targetRole: notification.target_role
      })));
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const addNotification = async (notification: Omit<Notification, 'id' | 'created_at' | 'read'>) => {
    try {
      const notificationData = {
        type: notification.type,
        title: notification.title,
        message: notification.message,
        user_id: notification.userId || null,
        tournament_id: notification.tournamentId || null,
        tournament_name: notification.tournamentName || null,
        target_role: notification.targetRole || null,
        read: false
      };

      const newNotification = await notificationService.createNotification(notificationData);
      
      // If notification creation failed (e.g., Supabase not connected), continue silently
      if (!newNotification) {
        console.warn('Notification creation skipped - service not available');
        return;
      }

      // Add to local state
      const mappedNotification: Notification = {
        id: newNotification.id,
        type: newNotification.type,
        title: newNotification.title,
        message: newNotification.message,
        created_at: newNotification.created_at,
        read: newNotification.read,
        userId: newNotification.user_id,
        tournamentId: newNotification.tournament_id,
        tournamentName: newNotification.tournament_name,
        targetRole: newNotification.target_role
      };

      setNotifications(prev => [mappedNotification, ...prev]);

      // Show toast notification
      toast.success(notification.title, {
        duration: 4000,
        position: 'top-right'
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      // Continue silently - notifications are not critical for core functionality
      console.warn('Notification creation failed, continuing without notification');
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Fallback to local update
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      await notificationService.markAllAsRead(user.id);
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      // Fallback to local update
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications
      }
      }
    >
      {children}
    </NotificationContext.Provider>
  );
};