import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Trophy, Target, TrendingUp, Award, Calendar } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { OrganizerRatingSystem } from './OrganizerRatingSystem';
import toast from 'react-hot-toast';

interface PerformanceRating {
  id: string;
  player_id: string;
  tournament_id: string;
  tournament_name: string;
  self_rating: number;
  performance_notes: string;
  goals_achieved: string[];
  areas_for_improvement: string[];
  created_at: string;
}

interface PlayerPerformanceRatingProps {
  tournamentId?: string;
  tournamentName?: string;
  organizerId?: string;
  organizerName?: string;
}

export const PlayerPerformanceRating: React.FC<PlayerPerformanceRatingProps> = ({
  tournamentId,
  tournamentName,
  organizerId,
  organizerName
}) => {
  const { user } = useAuth();
  const [selectedTournament, setSelectedTournament] = useState(tournamentId || '');
  const [userTournaments, setUserTournaments] = useState<any[]>([]);
  const [performanceRating, setPerformanceRating] = useState(0);
  const [performanceNotes, setPerformanceNotes] = useState('');
  const [goalsAchieved, setGoalsAchieved] = useState<string[]>([]);
  const [improvements, setImprovements] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showOrganizerRating, setShowOrganizerRating] = useState(false);

  useEffect(() => {
    loadUserTournaments();
  }, [user?.id]);

  const loadUserTournaments = () => {
    if (!user?.id) return;
    
    try {
      // Load tournaments user has participated in
      const registrations = JSON.parse(localStorage.getItem(`player_registrations_${user.id}`) || '[]');
      const completedTournaments = registrations.filter((reg: any) => {
        const tournament = JSON.parse(localStorage.getItem('tournaments') || '[]')
          .find((t: any) => t.id === reg.tournament_id);
        return tournament && new Date(tournament.end_date) < new Date();
      });
      
      setUserTournaments(completedTournaments);
    } catch (error) {
      console.error('Error loading user tournaments:', error);
    }
  };

  const getSelectedTournamentInfo = () => {
    if (!selectedTournament) return null;
    
    const registration = userTournaments.find(reg => reg.tournament_id === selectedTournament);
    if (!registration) return null;
    
    const tournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
    const tournament = tournaments.find((t: any) => t.id === selectedTournament);
    
    return { registration, tournament };
  };

  const submitPerformanceRating = async () => {
    if (!user?.id || !selectedTournament || performanceRating === 0) {
      toast.error('Please complete all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const tournamentInfo = getSelectedTournamentInfo();
      if (!tournamentInfo) {
        throw new Error('Tournament information not found');
      }

      const ratingData: PerformanceRating = {
        id: `perf_rating_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        player_id: user.id,
        tournament_id: selectedTournament,
        tournament_name: tournamentInfo.tournament?.name || tournamentName || 'Unknown Tournament',
        self_rating: performanceRating,
        performance_notes: performanceNotes.trim(),
        goals_achieved: goalsAchieved,
        areas_for_improvement: improvements,
        created_at: new Date().toISOString()
      };

      // Save to localStorage (in real app, this would go to database)
      const existingRatings = JSON.parse(localStorage.getItem('performance_ratings') || '[]');
      existingRatings.push(ratingData);
      localStorage.setItem('performance_ratings', JSON.stringify(existingRatings));

      toast.success('Performance rating submitted successfully!');
      
      // Reset form
      setPerformanceRating(0);
      setPerformanceNotes('');
      setGoalsAchieved([]);
      setImprovements([]);
      
      // Show organizer rating option
      setShowOrganizerRating(true);
    } catch (error) {
      console.error('Error submitting performance rating:', error);
      toast.error('Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  const addGoal = (goal: string) => {
    if (goal.trim() && !goalsAchieved.includes(goal.trim())) {
      setGoalsAchieved([...goalsAchieved, goal.trim()]);
    }
  };

  const removeGoal = (index: number) => {
    setGoalsAchieved(goalsAchieved.filter((_, i) => i !== index));
  };

  const addImprovement = (improvement: string) => {
    if (improvement.trim() && !improvements.includes(improvement.trim())) {
      setImprovements([...improvements, improvement.trim()]);
    }
  };

  const removeImprovement = (index: number) => {
    setImprovements(improvements.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Target className="h-5 w-5 mr-2 text-blue-600" />
          Rate Your Performance
        </h3>

        {/* Tournament Selection */}
        {!tournamentId && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Tournament
            </label>
            <select
              value={selectedTournament}
              onChange={(e) => setSelectedTournament(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a completed tournament...</option>
              {userTournaments.map((registration) => {
                const tournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
                const tournament = tournaments.find((t: any) => t.id === registration.tournament_id);
                return (
                  <option key={registration.tournament_id} value={registration.tournament_id}>
                    {tournament?.name || 'Unknown Tournament'} - {tournament?.sport_type}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Self Performance Rating */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            How would you rate your overall performance?
          </label>
          <div className="flex justify-center space-x-2 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setPerformanceRating(star)}
                className="p-1"
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    star <= performanceRating
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="text-center text-sm text-gray-600">
            {performanceRating === 0 ? 'Select a rating' :
             performanceRating === 1 ? 'Needs Improvement' :
             performanceRating === 2 ? 'Below Average' :
             performanceRating === 3 ? 'Average' :
             performanceRating === 4 ? 'Good' :
             'Excellent'}
          </p>
        </div>

        {/* Performance Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Performance Notes
          </label>
          <textarea
            value={performanceNotes}
            onChange={(e) => setPerformanceNotes(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Reflect on your performance, what went well, what could be improved..."
            maxLength={1000}
          />
          <p className="text-xs text-gray-500 mt-1">
            {performanceNotes.length}/1000 characters
          </p>
        </div>

        {/* Goals Achieved */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Goals Achieved
          </label>
          <div className="space-y-2">
            {goalsAchieved.map((goal, index) => (
              <div key={index} className="flex items-center justify-between bg-green-50 p-2 rounded">
                <span className="text-sm text-green-800">{goal}</span>
                <button
                  onClick={() => removeGoal(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </div>
            ))}
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Add a goal you achieved..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addGoal(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  addGoal(input.value);
                  input.value = '';
                }}
              >
                Add
              </Button>
            </div>
          </div>
        </div>

        {/* Areas for Improvement */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Areas for Improvement
          </label>
          <div className="space-y-2">
            {improvements.map((improvement, index) => (
              <div key={index} className="flex items-center justify-between bg-orange-50 p-2 rounded">
                <span className="text-sm text-orange-800">{improvement}</span>
                <button
                  onClick={() => removeImprovement(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </div>
            ))}
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Add an area to improve..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addImprovement(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  addImprovement(input.value);
                  input.value = '';
                }}
              >
                Add
              </Button>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={submitPerformanceRating}
          loading={submitting}
          disabled={!selectedTournament || performanceRating === 0}
          className="w-full"
        >
          Submit Performance Rating
        </Button>
      </Card>

      {/* Organizer Rating Section */}
      {showOrganizerRating && organizerId && organizerName && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <OrganizerRatingSystem
            organizerId={organizerId}
            organizerName={organizerName}
            tournamentId={selectedTournament}
            tournamentName={tournamentName || ''}
            onRatingSubmitted={() => {
              toast.success('Thank you for rating the organizer!');
              setShowOrganizerRating(false);
            }}
          />
        </motion.div>
      )}
    </div>
  );
};