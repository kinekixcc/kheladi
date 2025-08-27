# Team Management System for Players

## Overview

The Team Management System allows players to create teams, manage team members, send invitations, and handle team-related activities within the Playo platform. This system provides a comprehensive solution for team-based sports and tournaments.

## Features

### 🏆 Team Creation
- **Create New Teams**: Players can create teams with custom names, descriptions, and sport types
- **Team Configuration**: Set maximum member limits and team details
- **Automatic Captain Assignment**: Team creator automatically becomes the team captain

### 👥 Team Management
- **Member Management**: Add, remove, and manage team members
- **Role Assignment**: Support for Captain, Vice Captain, and Member roles
- **Team Settings**: Edit team information, transfer captaincy, and delete teams

### 📧 Team Invitations
- **Send Invitations**: Team captains can invite players by email
- **Invitation Management**: Track pending, accepted, and declined invitations
- **Expiration System**: Invitations automatically expire after 7 days
- **Custom Messages**: Include personalized messages with invitations

### 🔐 Security & Permissions
- **Row Level Security**: Users can only access their own team data
- **Captain Privileges**: Only team captains can send invitations and manage teams
- **Member Permissions**: Regular members can view team details and leave teams

## Database Schema

### Tables

#### `teams`
```sql
- id: UUID (Primary Key)
- name: TEXT (Team name)
- description: TEXT (Team description)
- sport_type: TEXT (Sport type)
- captain_id: UUID (References user_profiles)
- max_members: INTEGER (Maximum team size)
- current_members: INTEGER (Current member count)
- logo_url: TEXT (Team logo URL)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### `team_members`
```sql
- id: UUID (Primary Key)
- team_id: UUID (References teams)
- user_id: UUID (References user_profiles)
- role: TEXT (captain, vice_captain, member)
- joined_at: TIMESTAMP
```

#### `team_invitations`
```sql
- id: UUID (Primary Key)
- team_id: UUID (References teams)
- inviter_id: UUID (References user_profiles)
- invitee_id: UUID (References user_profiles)
- message: TEXT (Optional invitation message)
- status: TEXT (pending, accepted, declined, expired)
- expires_at: TIMESTAMP (Invitation expiration)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## API Endpoints

### Team Service (`src/lib/teamService.ts`)

#### Team Management
- `createTeam(teamData, captainId)`: Create a new team
- `getUserTeams(userId)`: Get all teams where user is a member
- `getTeamById(teamId)`: Get detailed team information with members
- `updateTeam(teamId, updates)`: Update team information
- `deleteTeam(teamId, captainId)`: Delete team (captain only)

#### Member Management
- `addTeamMember(userId, teamId, role)`: Add new member to team
- `removeTeamMember(userId, teamId)`: Remove member from team
- `leaveTeam(userId, teamId)`: Leave team (non-captain)
- `transferCaptaincy(teamId, newCaptainId, currentCaptainId)`: Transfer team leadership

#### Invitation System
- `sendTeamInvitation(teamId, inviterId, inviteeEmail, message)`: Send team invitation
- `getUserTeamInvitations(userId)`: Get pending invitations for user
- `acceptTeamInvitation(invitationId)`: Accept team invitation
- `declineTeamInvitation(invitationId)`: Decline team invitation

## Components

### PlayerTeamManagement (`src/components/team/PlayerTeamManagement.tsx`)

The main component that provides the complete team management interface for players.

#### Features
- **Tabbed Interface**: Overview, Create Team, and Invitations tabs
- **Team Grid**: Visual display of all user teams with key information
- **Team Creation Form**: Comprehensive form for creating new teams
- **Invitation Management**: Accept/decline team invitations
- **Team Details Modal**: Detailed view with member management and settings

#### Usage
```tsx
import { PlayerTeamManagement } from '../components/team/PlayerTeamManagement';

// In your component
<PlayerTeamManagement />
```

## Setup Instructions

### 1. Database Migration

Run the team invitations migration to create the necessary tables:

```bash
# Apply the migration
psql -d your_database -f supabase/migrations/20250101000005_team_invitations.sql
```

### 2. Component Integration

The `PlayerTeamManagement` component is already integrated into the PlayerDashboard under the "Teams" tab.

### 3. Environment Variables

Ensure your Supabase configuration is properly set up in `src/lib/supabase.ts`.

## Usage Examples

### Creating a Team

```tsx
const handleCreateTeam = async () => {
  const teamData = {
    name: "Elite Footballers",
    description: "Professional football team",
    sport_type: "Football",
    max_members: 11
  };
  
  const newTeam = await teamService.createTeam(teamData, userId);
  if (newTeam) {
    toast.success('Team created successfully!');
  }
};
```

### Sending Team Invitation

```tsx
const handleSendInvitation = async () => {
  const invitation = await teamService.sendTeamInvitation(
    teamId,
    userId,
    "player@example.com",
    "Join our winning team!"
  );
  
  if (invitation) {
    toast.success('Invitation sent successfully!');
  }
};
```

### Accepting Team Invitation

```tsx
const handleAcceptInvitation = async (invitationId: string) => {
  const success = await teamService.acceptTeamInvitation(invitationId);
  if (success) {
    toast.success('Welcome to the team!');
    loadData(); // Refresh team data
  }
};
```

## Security Features

### Row Level Security (RLS)
- Users can only view teams they're members of
- Team captains have full management privileges
- Invitations are restricted to team captains only
- Users can only manage their own invitations

### Data Validation
- Team size limits enforced
- Duplicate invitations prevented
- Expired invitations automatically handled
- Role-based permission checks

## Error Handling

The system includes comprehensive error handling:

- **Validation Errors**: Form validation and user feedback
- **Permission Errors**: Clear messages for unauthorized actions
- **Network Errors**: Graceful fallbacks and retry mechanisms
- **Database Errors**: User-friendly error messages

## Future Enhancements

### Planned Features
- **Team Chat System**: In-team communication
- **Team Statistics**: Performance tracking and analytics
- **Team Tournaments**: Direct tournament registration
- **Team Photos**: Team gallery and media management
- **Team Scheduling**: Practice and match scheduling
- **Team Analytics**: Performance metrics and insights

### Technical Improvements
- **Real-time Updates**: Live team member changes
- **Push Notifications**: Invitation and update notifications
- **Mobile Optimization**: Enhanced mobile experience
- **Offline Support**: Basic offline functionality

## Troubleshooting

### Common Issues

#### Invitation Not Received
- Check if user email exists in the system
- Verify invitation hasn't expired
- Ensure user has proper permissions

#### Team Creation Fails
- Verify all required fields are filled
- Check user authentication status
- Ensure database connection is working

#### Permission Denied
- Verify user is team captain for management actions
- Check if user is logged in
- Ensure proper role assignments

### Debug Mode

Enable debug logging by checking browser console for detailed error information.

## Support

For technical support or feature requests related to the Team Management System, please refer to the main project documentation or contact the development team.

---

**Note**: This system is designed to work with the existing Playo platform infrastructure and follows the established patterns and conventions.

