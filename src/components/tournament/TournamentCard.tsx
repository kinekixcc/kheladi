import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Users, Shield, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Add navigation hook
import { Button } from '../ui/Button';
import { Tournament } from '../../types'; // Import the actual Tournament type

interface TournamentCardProps {
  tournament: Tournament;
  index?: number; // Add index for staggered animations
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

const TournamentCard: React.FC<TournamentCardProps> = ({ tournament, index = 0 }) => {
  const navigate = useNavigate(); // Add navigation hook
  const { name, sport_type, start_date, venue_name, images, current_participants, max_participants } = tournament;
  
  // State for image carousel
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageInterval, setImageInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Get valid images array
  const validImages = images && Array.isArray(images) ? images.filter(img => img && img.trim() !== '') : [];
  
  // Auto-cycle through images
  useEffect(() => {
    if (validImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % validImages.length);
      }, 3000); // Change image every 3 seconds
      
      setImageInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [validImages.length]);
  
  // Manual navigation
  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (imageInterval) clearInterval(imageInterval);
    setCurrentImageIndex(prev => (prev + 1) % validImages.length);
  };
  
  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (imageInterval) clearInterval(imageInterval);
    setCurrentImageIndex(prev => (prev - 1 + validImages.length) % validImages.length);
  };

  const getImageContent = () => {
    // First priority: Use the images array from tournament data (uploaded by organizers)
    if (validImages.length > 0) {
      return (
        <div className="tournament-card-image-container">
          <img 
            src={validImages[currentImageIndex]} 
            alt={`${name} tournament - Image ${currentImageIndex + 1}`} 
            className="tournament-card-image" 
          />
          
          {/* Image Navigation - only show if multiple images */}
          {validImages.length > 1 && (
            <>
              {/* Image Counter */}
              <div className="tournament-card-image-counter">
                {currentImageIndex + 1} / {validImages.length}
              </div>
              
              {/* Navigation Arrows */}
              <button 
                onClick={prevImage}
                className="tournament-card-nav tournament-card-nav-left"
                title="Previous image"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={nextImage}
                className="tournament-card-nav tournament-card-nav-right"
                title="Next image"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              
              {/* Dots Indicator */}
              <div className="tournament-card-dots">
                {validImages.map((_, dotIndex) => (
                  <button
                    key={dotIndex}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (imageInterval) clearInterval(imageInterval);
                      setCurrentImageIndex(dotIndex);
                    }}
                    className={`tournament-card-dot ${dotIndex === currentImageIndex ? 'active' : ''}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      );
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