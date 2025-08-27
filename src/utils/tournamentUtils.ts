import { Tournament } from '../types';

export const tournamentUtils = {
  // Check if registration is still open (allows same-day registration until end of day)
  isRegistrationOpen(tournament: Tournament): boolean {
    if (!tournament.registration_deadline) return false;
    
    const now = new Date();
    const deadline = new Date(tournament.registration_deadline);
    
    // Allow registration until end of registration deadline day (23:59:59)
    deadline.setHours(23, 59, 59, 999);
    
    return now <= deadline && 
           (tournament.current_participants || 0) < (tournament.max_participants || 0);
  },

  // Check if tournament is visible to players
  isTournamentVisible(tournament: Tournament): boolean {
    const now = new Date();
    const endDate = new Date(tournament.end_date);
    
    // Hide tournaments that ended more than 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return endDate >= thirtyDaysAgo;
  },

  // Get tournament status for display
  getTournamentStatus(tournament: Tournament): {
    label: string;
    color: string;
    description: string;
  } {
    const now = new Date();
    const startDate = new Date(tournament.start_date);
    const endDate = new Date(tournament.end_date);
    const isRegOpen = this.isRegistrationOpen(tournament);
    const isVisible = this.isTournamentVisible(tournament);
    
    if (!isVisible) {
      return {
        label: 'Archived',
        color: 'bg-gray-100 text-gray-800',
        description: 'This tournament has ended and is no longer visible'
      };
    }
    
    if (isRegOpen) {
      return {
        label: 'Registration Open',
        color: 'bg-green-100 text-green-800',
        description: 'You can still register for this tournament'
      };
    }
    
    if (now < startDate) {
      return {
        label: 'Registration Closed',
        color: 'bg-orange-100 text-orange-800',
        description: 'Registration is closed but tournament hasn\'t started yet'
      };
    }
    
    if (now >= startDate && now <= endDate) {
      return {
        label: 'In Progress',
        color: 'bg-blue-100 text-blue-800',
        description: 'Tournament is currently running'
      };
    }
    
    if (now > endDate) {
      return {
        label: 'Completed',
        color: 'bg-purple-100 text-purple-800',
        description: 'Tournament has finished'
      };
    }
    
    return {
      label: 'Unknown',
      color: 'bg-gray-100 text-gray-800',
      description: 'Tournament status is unclear'
    };
  },

  // Check if user can register
  canUserRegister(tournament: Tournament, user: any, isAlreadyRegistered: boolean): {
    canRegister: boolean;
    reason?: string;
  } {
    if (!user) {
      return { canRegister: false, reason: 'You must be logged in to register' };
    }
    
    if (isAlreadyRegistered) {
      return { canRegister: false, reason: 'You are already registered for this tournament' };
    }
    
    if (!this.isRegistrationOpen(tournament)) {
      return { canRegister: false, reason: 'Registration is closed for this tournament' };
    }
    
    if (!this.isTournamentVisible(tournament)) {
      return { canRegister: false, reason: 'This tournament is no longer available' };
    }
    
    return { canRegister: true };
  },

  // Get status badge for display
  getStatusBadge(tournament: Tournament): {
    label: string;
    color: string;
  } {
    const status = this.getTournamentStatus(tournament);
    return {
      label: status.label,
      color: status.color
    };
  }
};


