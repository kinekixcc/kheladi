import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Lock } from 'lucide-react';

interface RoleBasedAccessProps {
  allowedRoles: ('admin' | 'organizer' | 'player')[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireOwnership?: boolean;
  resourceOwnerId?: string;
}

export const RoleBasedAccess: React.FC<RoleBasedAccessProps> = ({
  allowedRoles,
  children,
  fallback,
  requireOwnership = false,
  resourceOwnerId
}) => {
  const { user } = useAuth();

  // Check if user is authenticated
  if (!user) {
    return fallback || (
      <div className="text-center py-8">
        <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Authentication required</p>
      </div>
    );
  }

  // Check role permissions
  const hasRoleAccess = allowedRoles.includes(user.role);
  
  // Check ownership if required
  const hasOwnershipAccess = !requireOwnership || 
                            user.role === 'admin' || 
                            user.id === resourceOwnerId;

  if (!hasRoleAccess || !hasOwnershipAccess) {
    return fallback || (
      <div className="text-center py-8">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Insufficient permissions</p>
      </div>
    );
  }

  return <>{children}</>;
};

// Hook for checking permissions
export const usePermissions = () => {
  const { user } = useAuth();

  const hasRole = (role: 'admin' | 'organizer' | 'player') => {
    return user?.role === role;
  };

  const canManageResource = (resourceOwnerId?: string) => {
    if (!user) return false;
    return user.role === 'admin' || user.id === resourceOwnerId;
  };

  const canDeleteTournament = (tournament: any) => {
    if (!user) return false;
    
    // Admin can delete any tournament
    if (user.role === 'admin') return true;
    
    // Organizers can only delete their own tournaments
    if (user.role === 'organizer' && tournament.organizer_id === user.id) {
      // Can delete if not active
      return tournament.status !== 'active';
    }
    
    return false;
  };

  const canModifyTournament = (tournament: any) => {
    if (!user) return false;
    
    // Admin can modify any tournament
    if (user.role === 'admin') return true;
    
    // Organizers can modify their own tournaments
    return user.role === 'organizer' && tournament.organizer_id === user.id;
  };

  return {
    user,
    hasRole,
    canManageResource,
    canDeleteTournament,
    canModifyTournament,
    isAdmin: user?.role === 'admin',
    isOrganizer: user?.role === 'organizer',
    isPlayer: user?.role === 'player'
  };
};