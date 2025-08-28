import React from 'react';
import { MapPin, Calendar, Users, Shield, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Add navigation hook
import { Button } from '../ui/Button';
import { Tournament } from '../../types'; // Import the actual Tournament type

interface TournamentCardProps {
  tournament: Tournament;
}

// Use actual placeholder images that exist or create fallback content
const getSportIcon = (sportType: string) => {
  const sport = sportType.toLowerCase();
  if (sport.includes('valorant') || sport.includes('fps') || sport.includes('shooting')) {
    return '🎯';
  } else if (sport.includes('futsal') || sport.includes('football') || sport.includes('soccer')) {
    return '⚽';
  } else if (sport.includes('dota') || sport.includes('moba') || sport.includes('strategy')) {
    return '⚔️';
  } else if (sport.includes('basketball')) {
    return '🏀';
  } else if (sport.includes('cricket')) {
    return '🏏';
  } else if (sport.includes('tennis')) {
    return '🎾';
  } else if (sport.includes('badminton')) {
    return '🏸';
  } else {
    return '🏆';
  }
};

const TournamentCard: React.FC<TournamentCardProps> = ({ tournament }) => {
  const navigate = useNavigate(); // Add navigation hook
  const { name, sport_type, start_date, venue_name, images, current_participants, max_participants } = tournament;

  const getImageContent = () => {
    // First priority: Use the images array from tournament data (uploaded by organizers)
    if (images && images.length > 0) {
      return <img src={images[0]} alt={`${name} tournament`} className="tournament-card-image" />;
    }
    
    // Fallback: Create a fallback with sport icon and gradient background
    const sportIcon = getSportIcon(sport_type);
    return (
      <div className="tournament-card-fallback">
        <div className="tournament-card-fallback-icon">{sportIcon}</div>
        <div className="tournament-card-fallback-text">{sport_type}</div>
      </div>
    );
  };

  // Use the correct participant count fields
  const participantCount = current_participants || 0;
  const maxParticipantCount = max_participants || 0;

  // Add click handler for View Details button
  const handleViewDetails = () => {
    navigate(`/tournament/${tournament.id}`);
  };

  // Add click handler for Join Now button
  const handleJoinNow = () => {
    navigate(`/tournament/${tournament.id}/register`);
  };

  return (
    <div className="card tournament-card-pro">
      <div className="tournament-card-image-wrapper">
        {getImageContent()}
        <span className="tournament-card-badge">{sport_type}</span>
      </div>
      <div className="tournament-card-content">
        <h3 className="tournament-card-title">{name}</h3>
        <div className="tournament-card-meta">
          <div className="meta-item">
            <Calendar className="meta-icon" />
            <span>Starts {new Date(start_date).toLocaleDateString()}</span>
          </div>
          <div className="meta-item">
            <Users className="meta-icon" />
            <span>{participantCount} / {maxParticipantCount} Participants</span>
          </div>
          <div className="meta-item">
            <MapPin className="meta-icon" />
            <span>{venue_name}</span>
          </div>
        </div>
        <div className="tournament-card-actions">
          <Button onClick={handleViewDetails}>View Details</Button>
          <Button className="primary" onClick={handleJoinNow}>Join Now</Button>
        </div>
      </div>
    </div>
  );
};

// Export both as default and named export to support both import styles
export default TournamentCard;
export { TournamentCard };