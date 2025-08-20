import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Trophy, Shield, CheckCircle, MessageCircle, ThumbsUp } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface OrganizerRating {
  id: string;
  organizer_id: string;
  player_id: string;
  tournament_id: string;
  rating: number;
  review: string;
  created_at: string;
}

interface OrganizerRatingSystemProps {
  organizerId: string;
  organizerName: string;
  tournamentId: string;
  tournamentName: string;
  onRatingSubmitted?: () => void;
}

export const OrganizerRatingSystem: React.FC<OrganizerRatingSystemProps> = ({
  organizerId,
  organizerName,
  tournamentId,
  tournamentName,
  onRatingSubmitted
}) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [existingRating, setExistingRating] = useState<OrganizerRating | null>(null);

  useEffect(() => {
    checkExistingRating();
  }, [user?.id, organizerId, tournamentId]);

  const checkExistingRating = async () => {
    if (!user?.id) return;
    
    try {
      // Check if user has already rated this organizer for this tournament
      const existingRatings = JSON.parse(localStorage.getItem('organizer_ratings') || '[]');
      const existing = existingRatings.find((r: OrganizerRating) => 
        r.organizer_id === organizerId && 
        r.player_id === user.id && 
        r.tournament_id === tournamentId
      );
      
      if (existing) {
        setHasRated(true);
        setExistingRating(existing);
        setRating(existing.rating);
        setReview(existing.review);
      }
    } catch (error) {
      console.error('Error checking existing rating:', error);
    }
  };

  const submitRating = async () => {
    if (!user?.id || rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      const ratingData: OrganizerRating = {
        id: `rating_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        organizer_id: organizerId,
        player_id: user.id,
        tournament_id: tournamentId,
        rating,
        review: review.trim(),
        created_at: new Date().toISOString()
      };

      // Save to localStorage (in real app, this would go to database)
      const existingRatings = JSON.parse(localStorage.getItem('organizer_ratings') || '[]');
      
      if (hasRated) {
        // Update existing rating
        const updatedRatings = existingRatings.map((r: OrganizerRating) =>
          r.organizer_id === organizerId && r.player_id === user.id && r.tournament_id === tournamentId
            ? ratingData
            : r
        );
        localStorage.setItem('organizer_ratings', JSON.stringify(updatedRatings));
        toast.success('Rating updated successfully!');
      } else {
        // Add new rating
        existingRatings.push(ratingData);
        localStorage.setItem('organizer_ratings', JSON.stringify(existingRatings));
        setHasRated(true);
        toast.success('Rating submitted successfully!');
      }

      setExistingRating(ratingData);
      
      if (onRatingSubmitted) {
        onRatingSubmitted();
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Rate Organizer
        </h3>
        <p className="text-gray-600 text-sm">
          How was your experience with {organizerName}?
        </p>
      </div>

      {/* Star Rating */}
      <div className="flex justify-center mb-6">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="p-1"
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(star)}
            disabled={hasRated && !existingRating}
          >
            <Star
              className={`h-8 w-8 transition-colors ${
                star <= (hoverRating || rating)
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>

      {/* Rating Labels */}
      <div className="text-center mb-4">
        <p className="text-sm text-gray-600">
          {rating === 0 ? 'Select a rating' :
           rating === 1 ? 'Poor' :
           rating === 2 ? 'Fair' :
           rating === 3 ? 'Good' :
           rating === 4 ? 'Very Good' :
           'Excellent'}
        </p>
      </div>

      {/* Review Text */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Review (Optional)
        </label>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Share your experience with other players..."
          maxLength={500}
          disabled={hasRated && !existingRating}
        />
        <p className="text-xs text-gray-500 mt-1">
          {review.length}/500 characters
        </p>
      </div>

      {/* Submit Button */}
      <Button
        onClick={submitRating}
        loading={submitting}
        disabled={rating === 0 || (hasRated && !existingRating)}
        className="w-full"
      >
        {hasRated ? 'Update Rating' : 'Submit Rating'}
      </Button>

      {hasRated && existingRating && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800">
              You rated this organizer {existingRating.rating} stars
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};