import { supabase, isSupabaseConfigured } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export class RealtimeManager {
  private static instance: RealtimeManager;
  private channels: Map<string, RealtimeChannel> = new Map();
  private subscribers: Map<string, Set<(payload: any) => void>> = new Map();

  static getInstance(): RealtimeManager {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager();
    }
    return RealtimeManager.instance;
  }

  // Subscribe to tournament updates
  subscribeTournamentUpdates(callback: (payload: any) => void): () => void {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, realtime updates disabled');
      return () => {};
    }

    const channelName = 'tournaments';
    
    if (!this.channels.has(channelName)) {
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tournaments'
          },
          (payload) => {
            console.log('Tournament update received:', payload);
            this.notifySubscribers(channelName, payload);
          }
        )
        .subscribe();
      
      this.channels.set(channelName, channel);
      this.subscribers.set(channelName, new Set());
    }

    // Add callback to subscribers
    const subscribers = this.subscribers.get(channelName)!;
    subscribers.add(callback);

    // Return unsubscribe function
    return () => {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        this.unsubscribeChannel(channelName);
      }
    };
  }

  // Subscribe to registration updates
  subscribeRegistrationUpdates(callback: (payload: any) => void): () => void {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, realtime updates disabled');
      
      // Set up polling fallback for registration updates
      const pollInterval = setInterval(() => {
        // This would trigger a data refresh in the component
        callback({ eventType: 'POLL_UPDATE', source: 'fallback' });
      }, 10000); // Poll every 10 seconds
      
      return () => clearInterval(pollInterval);
    }

    const channelName = 'registrations';
    
    if (!this.channels.has(channelName)) {
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tournament_registrations'
          },
          (payload) => {
            console.log('Registration update received:', payload);
            this.notifySubscribers(channelName, payload);
          }
        )
        .subscribe();
      
      this.channels.set(channelName, channel);
      this.subscribers.set(channelName, new Set());
    }

    const subscribers = this.subscribers.get(channelName)!;
    subscribers.add(callback);

    return () => {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        this.unsubscribeChannel(channelName);
      }
    };
  }

  // Subscribe to notification updates
  subscribeNotificationUpdates(userId: string, callback: (payload: any) => void): () => void {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, realtime updates disabled');
      return () => {};
    }

    const channelName = `notifications_${userId}`;
    
    if (!this.channels.has(channelName)) {
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('Notification update received:', payload);
            this.notifySubscribers(channelName, payload);
          }
        )
        .subscribe();
      
      this.channels.set(channelName, channel);
      this.subscribers.set(channelName, new Set());
    }

    const subscribers = this.subscribers.get(channelName)!;
    subscribers.add(callback);

    return () => {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        this.unsubscribeChannel(channelName);
      }
    };
  }

  // Subscribe to global activity (for admin dashboard)
  subscribeGlobalActivity(callback: (payload: any) => void): () => void {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, realtime updates disabled');
      return () => {};
    }

    const channelName = 'global_activity';
    
    if (!this.channels.has(channelName)) {
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tournaments'
          },
          (payload) => this.notifySubscribers(channelName, { type: 'tournament', ...payload })
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tournament_registrations'
          },
          (payload) => this.notifySubscribers(channelName, { type: 'registration', ...payload })
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles'
          },
          (payload) => this.notifySubscribers(channelName, { type: 'user', ...payload })
        )
        .subscribe();
      
      this.channels.set(channelName, channel);
      this.subscribers.set(channelName, new Set());
    }

    const subscribers = this.subscribers.get(channelName)!;
    subscribers.add(callback);

    return () => {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        this.unsubscribeChannel(channelName);
      }
    };
  }

  private notifySubscribers(channelName: string, payload: any) {
    const subscribers = this.subscribers.get(channelName);
    if (subscribers) {
      subscribers.forEach(callback => callback(payload));
    }
  }

  private unsubscribeChannel(channelName: string) {
    const channel = this.channels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
      this.subscribers.delete(channelName);
    }
  }

  // Cleanup all subscriptions
  cleanup() {
    this.channels.forEach((channel, channelName) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
    this.subscribers.clear();
  }
}

export const realtimeManager = RealtimeManager.getInstance();