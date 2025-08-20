import { supabase, isSupabaseConfigured } from './supabase';

export interface AuditLogEntry {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  resource_type: 'tournament' | 'registration' | 'user' | 'badge' | 'rating';
  resource_id: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  metadata?: any;
}

class AuditLogService {
  private static instance: AuditLogService;
  private localLogs: AuditLogEntry[] = [];

  static getInstance(): AuditLogService {
    if (!AuditLogService.instance) {
      AuditLogService.instance = new AuditLogService();
    }
    return AuditLogService.instance;
  }

  async logAction(
    userId: string,
    userName: string,
    action: string,
    resourceType: AuditLogEntry['resource_type'],
    resourceId: string,
    oldValues?: any,
    newValues?: any,
    metadata?: any
  ): Promise<void> {
    const logEntry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      user_name: userName,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      old_values: oldValues,
      new_values: newValues,
      ip_address: await this.getClientIP(),
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      metadata
    };

    try {
      if (isSupabaseConfigured) {
        // In production, this would save to a dedicated audit_logs table
        console.log('Audit log entry:', logEntry);
        // await supabase.from('audit_logs').insert([logEntry]);
      }
      
      // Always keep local copy for immediate access
      this.localLogs.unshift(logEntry);
      
      // Keep only last 1000 entries in memory
      if (this.localLogs.length > 1000) {
        this.localLogs = this.localLogs.slice(0, 1000);
      }
      
      // Store in localStorage as backup
      localStorage.setItem('audit_logs', JSON.stringify(this.localLogs.slice(0, 100)));
    } catch (error) {
      console.error('Failed to log audit entry:', error);
    }
  }

  async getAuditLogs(
    filters?: {
      userId?: string;
      resourceType?: string;
      action?: string;
      startDate?: string;
      endDate?: string;
    },
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLogEntry[]> {
    try {
      let logs = [...this.localLogs];
      
      // Load from localStorage if empty
      if (logs.length === 0) {
        const storedLogs = localStorage.getItem('audit_logs');
        if (storedLogs) {
          logs = JSON.parse(storedLogs);
          this.localLogs = logs;
        }
      }

      // Apply filters
      if (filters) {
        logs = logs.filter(log => {
          if (filters.userId && log.user_id !== filters.userId) return false;
          if (filters.resourceType && log.resource_type !== filters.resourceType) return false;
          if (filters.action && !log.action.toLowerCase().includes(filters.action.toLowerCase())) return false;
          if (filters.startDate && new Date(log.timestamp) < new Date(filters.startDate)) return false;
          if (filters.endDate && new Date(log.timestamp) > new Date(filters.endDate)) return false;
          return true;
        });
      }

      // Apply pagination
      return logs.slice(offset, offset + limit);
    } catch (error) {
      console.error('Error retrieving audit logs:', error);
      return [];
    }
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  // Specific logging methods for common actions
  async logTournamentCreation(userId: string, userName: string, tournament: any): Promise<void> {
    await this.logAction(
      userId,
      userName,
      'CREATE_TOURNAMENT',
      'tournament',
      tournament.id,
      null,
      tournament,
      { sport_type: tournament.sport_type, entry_fee: tournament.entry_fee }
    );
  }

  async logTournamentApproval(adminId: string, adminName: string, tournamentId: string, approved: boolean): Promise<void> {
    await this.logAction(
      adminId,
      adminName,
      approved ? 'APPROVE_TOURNAMENT' : 'REJECT_TOURNAMENT',
      'tournament',
      tournamentId,
      { status: 'pending_approval' },
      { status: approved ? 'approved' : 'rejected' }
    );
  }

  async logRegistration(userId: string, userName: string, registration: any): Promise<void> {
    await this.logAction(
      userId,
      userName,
      'REGISTER_TOURNAMENT',
      'registration',
      registration.id,
      null,
      registration,
      { tournament_id: registration.tournament_id, entry_fee: registration.entry_fee }
    );
  }

  async logBadgeAward(adminId: string, adminName: string, organizerId: string, badgeType: string): Promise<void> {
    await this.logAction(
      adminId,
      adminName,
      'AWARD_BADGE',
      'badge',
      `${organizerId}_${badgeType}`,
      null,
      { organizer_id: organizerId, badge_type: badgeType },
      { badge_type: badgeType }
    );
  }

  async logRatingSubmission(userId: string, userName: string, rating: any): Promise<void> {
    await this.logAction(
      userId,
      userName,
      'SUBMIT_RATING',
      'rating',
      rating.id,
      null,
      rating,
      { organizer_id: rating.organizer_id, rating: rating.rating }
    );
  }
}

export const auditLogService = AuditLogService.getInstance();