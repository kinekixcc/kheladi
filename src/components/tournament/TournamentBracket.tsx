import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users, Calendar, MapPin, Crown, Medal, Award } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Tournament } from '../../types';

interface Match {
  id: string;
  round: number;
  position: number;
  player1?: {
    id: string;
    name: string;
    seed?: number;
  };
  player2?: {
    id: string;
    name: string;
    seed?: number;
  };
  winner?: string;
  score?: string;
  status: 'pending' | 'in_progress' | 'completed';
  scheduledTime?: string;
}

interface TournamentBracketProps {
  tournament: Tournament;
  matches: Match[];
  onUpdateMatch?: (matchId: string, winner: string, score: string) => void;
  isOrganizer?: boolean;
}

export const TournamentBracket: React.FC<TournamentBracketProps> = ({
  tournament,
  matches,
  onUpdateMatch,
  isOrganizer = false
}) => {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [scoreInput, setScoreInput] = useState('');

  // Generate bracket structure based on tournament type
  const generateBracketStructure = () => {
    const participants = tournament.current_participants || 0;
    const rounds = Math.ceil(Math.log2(participants));
    
    const bracket: Match[][] = [];
    
    for (let round = 0; round < rounds; round++) {
      const matchesInRound = Math.pow(2, rounds - round - 1);
      const roundMatches: Match[] = [];
      
      for (let position = 0; position < matchesInRound; position++) {
        const matchId = `round_${round}_match_${position}`;
        const existingMatch = matches.find(m => m.id === matchId);
        
        roundMatches.push(existingMatch || {
          id: matchId,
          round,
          position,
          status: 'pending'
        });
      }
      
      bracket.push(roundMatches);
    }
    
    return bracket;
  };

  const bracketStructure = generateBracketStructure();

  const getRoundName = (round: number, totalRounds: number) => {
    if (round === totalRounds - 1) return 'Final';
    if (round === totalRounds - 2) return 'Semi-Final';
    if (round === totalRounds - 3) return 'Quarter-Final';
    return `Round ${round + 1}`;
  };

  const handleMatchUpdate = (match: Match) => {
    if (!isOrganizer || match.status === 'completed') return;
    setSelectedMatch(match);
  };

  const submitMatchResult = () => {
    if (!selectedMatch || !onUpdateMatch) return;
    
    const winner = selectedMatch.player1?.id || selectedMatch.player2?.id || '';
    onUpdateMatch(selectedMatch.id, winner, scoreInput);
    setSelectedMatch(null);
    setScoreInput('');
  };

  return (
    <div className="space-y-8">
      {/* Tournament Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Trophy className="h-8 w-8 text-yellow-500" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{tournament.name}</h2>
              <p className="text-gray-600">{tournament.sport_type} Tournament</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {tournament.current_participants}/{tournament.max_participants}
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {tournament.start_date}
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {tournament.facility_name}
              </div>
            </div>
          </div>
        </div>
        
        {/* Prize Pool */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4">
          <div className="flex items-center justify-center space-x-8">
            <div className="text-center">
              <Crown className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
              <p className="text-sm text-gray-600">1st Place</p>
              <p className="font-bold text-yellow-600">रू {Math.floor(tournament.prize_pool * 0.5).toLocaleString()}</p>
            </div>
            <div className="text-center">
              <Medal className="h-6 w-6 text-gray-400 mx-auto mb-1" />
              <p className="text-sm text-gray-600">2nd Place</p>
              <p className="font-bold text-gray-600">रू {Math.floor(tournament.prize_pool * 0.3).toLocaleString()}</p>
            </div>
            <div className="text-center">
              <Award className="h-6 w-6 text-orange-400 mx-auto mb-1" />
              <p className="text-sm text-gray-600">3rd Place</p>
              <p className="font-bold text-orange-600">रू {Math.floor(tournament.prize_pool * 0.2).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Bracket Visualization */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Tournament Bracket</h3>
        
        <div className="overflow-x-auto">
          <div className="flex space-x-8 min-w-max">
            {bracketStructure.map((round, roundIndex) => (
              <div key={roundIndex} className="flex flex-col space-y-4">
                <h4 className="text-lg font-semibold text-center text-gray-700 mb-4">
                  {getRoundName(roundIndex, bracketStructure.length)}
                </h4>
                
                {round.map((match, matchIndex) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: roundIndex * 0.1 + matchIndex * 0.05 }}
                    className={`bg-white border-2 rounded-lg p-4 min-w-[200px] cursor-pointer transition-all ${
                      match.status === 'completed' 
                        ? 'border-green-300 bg-green-50' 
                        : match.status === 'in_progress'
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleMatchUpdate(match)}
                  >
                    {/* Match Header */}
                    <div className="text-center mb-3">
                      <span className="text-xs font-medium text-gray-500">
                        Match {matchIndex + 1}
                      </span>
                      {match.scheduledTime && (
                        <p className="text-xs text-gray-400">{match.scheduledTime}</p>
                      )}
                    </div>

                    {/* Players */}
                    <div className="space-y-2">
                      <div className={`flex items-center justify-between p-2 rounded ${
                        match.winner === match.player1?.id ? 'bg-green-100 border border-green-300' : 'bg-gray-50'
                      }`}>
                        <div className="flex items-center space-x-2">
                          {match.player1?.seed && (
                            <span className="text-xs bg-gray-200 text-gray-700 px-1 rounded">
                              #{match.player1.seed}
                            </span>
                          )}
                          <span className="font-medium text-sm">
                            {match.player1?.name || 'TBD'}
                          </span>
                        </div>
                        {match.winner === match.player1?.id && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      
                      <div className="text-center text-xs text-gray-400">vs</div>
                      
                      <div className={`flex items-center justify-between p-2 rounded ${
                        match.winner === match.player2?.id ? 'bg-green-100 border border-green-300' : 'bg-gray-50'
                      }`}>
                        <div className="flex items-center space-x-2">
                          {match.player2?.seed && (
                            <span className="text-xs bg-gray-200 text-gray-700 px-1 rounded">
                              #{match.player2.seed}
                            </span>
                          )}
                          <span className="font-medium text-sm">
                            {match.player2?.name || 'TBD'}
                          </span>
                        </div>
                        {match.winner === match.player2?.id && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </div>

                    {/* Match Status */}
                    <div className="mt-3 text-center">
                      {match.status === 'completed' && match.score && (
                        <p className="text-xs font-medium text-green-600">{match.score}</p>
                      )}
                      {match.status === 'in_progress' && (
                        <p className="text-xs font-medium text-blue-600">In Progress</p>
                      )}
                      {match.status === 'pending' && (
                        <p className="text-xs text-gray-500">Pending</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Match Update Modal */}
      {selectedMatch && isOrganizer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Update Match Result
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Winner
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="winner"
                      value={selectedMatch.player1?.id}
                      className="mr-2"
                    />
                    {selectedMatch.player1?.name || 'Player 1'}
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="winner"
                      value={selectedMatch.player2?.id}
                      className="mr-2"
                    />
                    {selectedMatch.player2?.name || 'Player 2'}
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Score
                </label>
                <input
                  type="text"
                  value={scoreInput}
                  onChange={(e) => setScoreInput(e.target.value)}
                  placeholder="e.g., 2-1, 21-19, 3-0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setSelectedMatch(null)}
              >
                Cancel
              </Button>
              <Button onClick={submitMatchResult}>
                Update Result
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};