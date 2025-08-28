import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  Trophy,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Clock,
  FileText,
  CheckCircle,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { tournamentService, registrationService } from '../lib/database';
import { auditLogService } from '../lib/auditLog';
import { sanitizeInput } from '../utils/dataValidation';
import { dummyPaymentProcessor } from '../lib/dummyPaymentSystem';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ESewaPayment } from '../components/payment/ESewaPayment';
import { Tournament } from '../types';

const registrationSchema = z.object({
  player_name: z.string().min(2, 'Player name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  age: z.number().min(13, 'Must be at least 13 years old').max(100, 'Invalid age'),
  experience_level: z.enum(['beginner', 'intermediate', 'advanced', 'professional']),
  team_name: z.string().optional(),
  emergency_contact: z.string().min(10, 'Emergency contact is required'),
  medical_conditions: z.string().optional(),
  terms_accepted: z.boolean().refine(val => val === true, 'You must accept the terms and conditions')
});

type RegistrationForm = z.infer<typeof registrationSchema>;

export const TournamentRegistration: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [registrationStep, setRegistrationStep] = useState<'form' | 'payment'>('form');
  const [registrationData, setRegistrationData] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      player_name: user?.full_name || '',
      email: user?.email || '',
      experience_level: 'intermediate'
    }
  });

  useEffect(() => {
    const loadTournament = async () => {
      if (!tournamentId) return;
      
      try {
        const tournamentData = await tournamentService.getTournamentById(tournamentId);
        setTournament(tournamentData);
      } catch (error) {
        console.error('Error loading tournament:', error);
        toast.error('Tournament not found');
        navigate('/tournament-map');
      }
    };
    
    loadTournament();
  }, [tournamentId, navigate]);

  const onSubmit = async (data: RegistrationForm) => {
    if (!tournament || !user) {
      toast.error('Tournament or user information not available');
      return;
    }

    setLoading(true);
    try {
      // Check if player is already registered
      const isAlreadyRegistered = await registrationService.isPlayerRegistered(tournament.id, user.id);
      if (isAlreadyRegistered) {
        toast.error('You are already registered for this tournament!');
        setLoading(false);
        return;
      }

      // Sanitize registration data
      const sanitizedData = {
        ...data,
        player_name: sanitizeInput(data.player_name),
        emergency_contact: sanitizeInput(data.emergency_contact),
        medical_conditions: data.medical_conditions ? sanitizeInput(data.medical_conditions) : undefined
      };

      // Calculate platform fee (10% of entry fee)
      const platformFee = Math.round((tournament.entry_fee || 0) * 0.1);
      const totalAmount = (tournament.entry_fee || 0) + platformFee;

      // Store registration data for payment page
      const paymentData = {
        tournament_name: tournament.name,
        entry_fee: tournament.entry_fee || 0,
        platform_fee: platformFee,
        total_amount: totalAmount,
        player_name: sanitizedData.player_name,
        tournament_data: tournament,
        registration_data: {
          tournament_id: tournament.id,
          player_id: user.id,
          player_name: sanitizedData.player_name,
          email: sanitizedData.email,
          phone: sanitizedData.phone,
          age: sanitizedData.age,
          experience_level: sanitizedData.experience_level,
          team_name: sanitizedData.team_name,
          emergency_contact: sanitizedData.emergency_contact,
          medical_conditions: sanitizedData.medical_conditions,
          status: 'registered',
          registration_date: new Date().toISOString()
        }
      };

      // Store in localStorage and redirect to payment page
      localStorage.setItem('pending_player_registration', JSON.stringify(paymentData));
      navigate('/player-registration-payment');

    } catch (error) {
      console.error('Registration preparation error:', error);
      toast.error('Failed to prepare registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentInitiated = () => {
    // Payment has been initiated, we'll handle completion on the success page
  };

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tournament details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/tournament-map')}
            className="mb-4" 
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tournaments
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tournament Registration</h1>
          <p className="text-gray-600">Register for {tournament.name}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Registration Form or Payment */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            {registrationStep === 'payment' ? (
              /* Payment Step */
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Complete Payment</h2>
                  <p className="text-gray-600">Complete your payment to confirm your tournament registration</p>
                </div>
                <ESewaPayment
                  amount={tournament.entry_fee}
                  tournamentId={tournament.id}
                  tournamentName={tournament.name}
                  userId={user?.id || ''}
                  onPaymentInitiated={handlePaymentInitiated}
                />
              </div>
            ) : (
              /* Registration Form */
            <Card className="p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Registration Details</h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        {...register('player_name')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your full name"
                      />
                      {errors.player_name && (
                        <p className="mt-1 text-sm text-red-600">{errors.player_name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Age *
                      </label>
                      <input
                        type="number"
                        {...register('age', { valueAsNumber: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your age"
                        min="13"
                        max="100"
                      />
                      {errors.age && (
                        <p className="mt-1 text-sm text-red-600">{errors.age.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        {...register('email')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your email"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        {...register('phone')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your phone number"
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tournament Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Tournament Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Experience Level *
                      </label>
                      <select
                        {...register('experience_level')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="professional">Professional</option>
                      </select>
                      {errors.experience_level && (
                        <p className="mt-1 text-sm text-red-600">{errors.experience_level.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Team Name (Optional)
                      </label>
                      <input
                        type="text"
                        {...register('team_name')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter team name if applicable"
                      />
                    </div>
                  </div>
                </div>

                {/* Emergency & Medical */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency & Medical Information</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Emergency Contact *
                      </label>
                      <input
                        type="tel"
                        {...register('emergency_contact')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Emergency contact phone number"
                      />
                      {errors.emergency_contact && (
                        <p className="mt-1 text-sm text-red-600">{errors.emergency_contact.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Medical Conditions (Optional)
                      </label>
                      <textarea
                        {...register('medical_conditions')}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Any medical conditions we should be aware of..."
                      />
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    {...register('terms_accepted')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    I agree to the tournament rules, terms and conditions, and understand that participation is at my own risk.
                  </label>
                </div>
                {errors.terms_accepted && (
                  <p className="text-sm text-red-600">{errors.terms_accepted.message}</p>
                )}

                {/* Submit Button */}
                <div className="flex justify-end pt-6 border-t">
                  <Button 
                    type="submit" 
                    loading={loading}
                    size="lg"
                    className="px-8"
                  >
                    {loading ? 'Registering...' : 'Register for Tournament'}
                  </Button>
                </div>
              </form>
            </Card>
            )}
          </motion.div>

          {/* Tournament Summary */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tournament Summary</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">{tournament.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{tournament.description}</p>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center">
                    <Trophy className="h-4 w-4 text-gray-400 mr-2" />
                    <span>{tournament.sport_type}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span>{tournament.start_date} to {tournament.end_date}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                    <span>{tournament.facility_name}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-gray-400 mr-2" />
                    <span>{tournament.current_participants || 0}/{tournament.max_participants} participants</span>
                  </div>
                  
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                    <span>Entry Fee: रू {tournament.entry_fee}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Trophy className="h-4 w-4 text-gray-400 mr-2" />
                    <span>Prize Pool: रू {tournament.prize_pool}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                    <span>Registration Deadline: {tournament.registration_deadline}</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium text-gray-900 mb-2">Organizer</h4>
                  <p className="text-sm text-gray-600">{tournament.organizer_name}</p>
                </div>

                {registrationStep === 'payment' && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-center text-sm text-blue-600 mb-2">
                      <CreditCard className="h-4 w-4 mr-1" />
                      Payment Required
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span>Total Amount:</span>
                    <span className="text-blue-600">रू {tournament.entry_fee}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {tournament.entry_fee > 0 
                      ? registrationStep === 'payment' 
                        ? 'Complete payment to confirm registration'
                        : 'Payment required after registration'
                      : 'Free tournament - no payment required'
                    }
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

