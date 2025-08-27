import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign, 
  Upload, 
  FileText,
  Image as ImageIcon,
  Trophy,
  Clock,
  Info,
  X,
  Search,
  Settings
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { tournamentService } from '../lib/database';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { auditLogService } from '../lib/auditLog';
import { validateTournamentData, sanitizeInput } from '../utils/dataValidation';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PlatformFeeCalculator } from '../components/monetization/PlatformFeeCalculator';
import { SupabaseConnectionBanner } from '../components/ui/SupabaseConnectionBanner';
import { SPORTS_TYPES, NEPAL_PROVINCES } from '../types';
import { notificationService } from '../lib/database';
import { imageUploadService } from '../lib/imageUpload';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const tournamentSchema = z.object({
  name: z.string().min(3, 'Tournament name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  sport_type: z.string().min(1, 'Please select a sport'),
  custom_sport: z.string().optional(), // New field for custom games
  tournament_type: z.enum(['single_elimination', 'double_elimination', 'round_robin', 'swiss', 'league']),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  registration_deadline: z.string().min(1, 'Registration deadline is required'),
  entry_fee: z.number().min(0, 'Entry fee cannot be negative'),
  prize_pool: z.number().min(0, 'Prize pool cannot be negative'),
  venue_name: z.string().min(1, 'Venue name is required'),
  venue_address: z.string().min(5, 'Venue address must be at least 5 characters'),
  province: z.string().min(1, 'Please select a province'),
  district: z.string().min(1, 'Please select a district'),
  rules: z.string().min(20, 'Rules must be at least 20 characters'),
  requirements: z.string().min(10, 'Requirements must be at least 10 characters'),
  contact_phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  contact_email: z.string().email('Please enter a valid email address'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  // Team Registration Settings
  max_teams: z.number().min(1).default(16),
  
  // New Playo.co fields
  requires_approval: z.boolean().default(true), // Admin approval is mandatory
  is_recurring: z.boolean().default(false),
  allow_individual_players: z.boolean().default(true),
  chat_enabled: z.boolean().default(true),
  visibility: z.enum(['public', 'private', 'invite_only']).default('public'),
  tags: z.array(z.string()).default([]),
  // Recurring schedule fields
  recurrence_type: z.enum(['daily', 'weekly', 'monthly', 'custom']).optional(),
  recurrence_interval: z.number().min(1).default(1),
  recurrence_days: z.array(z.number()).optional(),
  recurrence_day_of_month: z.number().min(1).max(31).optional(),
  recurrence_start_time: z.string().optional(),
  recurrence_end_time: z.string().optional(),
  recurrence_end_date: z.string().optional(),
  max_occurrences: z.number().min(1).optional(),
});

type TournamentForm = z.infer<typeof tournamentSchema>;

interface LocationMarkerProps {
  position: [number, number] | null;
  setPosition: (position: [number, number]) => void;
  onLocationSelect: (lat: number, lng: number) => void;
}

const LocationMarker: React.FC<LocationMarkerProps> = ({ position, setPosition, onLocationSelect }) => {
  useMapEvents({
    click(e) {
      const newPosition: [number, number] = [e.latlng.lat, e.latlng.lng];
      setPosition(newPosition);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
};

export const CreateTournament: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mapPosition, setMapPosition] = useState<[number, number] | null>([27.7172, 85.3240]); // Kathmandu default
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedPDF, setSelectedPDF] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [locationAddress, setLocationAddress] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [isPremiumListing, setIsPremiumListing] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showCustomSport, setShowCustomSport] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues
  } = useForm<TournamentForm>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      entry_fee: 0,
      prize_pool: 0,
      tournament_type: 'single_elimination',
      requires_approval: true, // Admin approval is mandatory
      is_recurring: false,
      max_teams: 16,
      allow_individual_players: true,
      chat_enabled: true,
      visibility: 'public',
      tags: [],
      recurrence_interval: 1
    }
  });

  const selectedProvince = watch('province');
  const entryFee = watch('entry_fee') || 0;
  const isRecurring = watch('is_recurring');
  const recurrenceType = watch('recurrence_type');
  const requiresApproval = watch('requires_approval');
  const sportType = watch('sport_type');

  const getDistrictsForProvince = (provinceName: string) => {
    const province = NEPAL_PROVINCES.find(p => p.name === provinceName);
    return province ? province.districts : [];
  };

  // Reverse geocoding function
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        setLocationAddress(data.display_name);
        
        // Try to auto-fill venue address if empty
        const currentAddress = getValues('venue_address');
        if (!currentAddress) {
          setValue('venue_address', data.display_name);
        }
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
  };

  // Search location function
  const searchLocation = async () => {
    if (!searchQuery.trim()) return;
    
    setSearchLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', Nepal')}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const newPosition: [number, number] = [parseFloat(result.lat), parseFloat(result.lon)];
        setMapPosition(newPosition);
        setLocationAddress(result.display_name);
        
        // Auto-fill venue address
        setValue('venue_address', result.display_name);
        
        toast.success('Location found!');
      } else {
        toast.error('Location not found. Try a different search term.');
      }
    } catch (error) {
      toast.error('Search failed. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    reverseGeocode(lat, lng);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + selectedImages.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum 5MB per image.`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image file.`);
        return false;
      }
      return true;
    });

    setSelectedImages(prev => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(prev => [...prev, e.target?.result as string]);
      };
      reader.onerror = () => {
        console.error(`Failed to process image ${file.name}`);
      };
      reader.readAsDataURL(file);
    });
    
    toast.success(`${validFiles.length} image(s) uploaded successfully`);
  };

  const handlePDFUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('PDF file must be less than 10MB');
      return;
    }

    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }

    setSelectedPDF(file);
    toast.success('PDF uploaded successfully');
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  const removePDF = () => {
    setSelectedPDF(null);
    if (pdfInputRef.current) {
      pdfInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: TournamentForm) => {
    setLoading(true);
    
    try {
      // Check if Supabase is connected first
      if (!isSupabaseConfigured) {
        throw new Error('Supabase not connected. Please connect to Supabase first to create tournaments that can be shared with everyone.');
      }
      
      console.log('🔄 Preparing tournament data for commission payment...');
      
      // Validate required fields
      if (!data.name || !data.sport_type || !data.venue_name) {
        throw new Error('Please fill in all required fields');
      }
      
      // Use custom sport if provided
      const finalSportType = data.sport_type === 'custom' && data.custom_sport ? data.custom_sport : data.sport_type;
      
      // Validate and sanitize data
      const sanitizedData = {
        ...data,
        sport_type: finalSportType,
        name: sanitizeInput(data.name),
        description: sanitizeInput(data.description),
        venue_name: sanitizeInput(data.venue_name),
        venue_address: sanitizeInput(data.venue_address),
        rules: sanitizeInput(data.rules),
        requirements: sanitizeInput(data.requirements),
        // Add missing required fields
        tournament_type: data.tournament_type || 'single_elimination',
        entry_fee: data.entry_fee || 0,
        prize_pool: data.prize_pool || 0,
        start_date: data.start_date,
        end_date: data.end_date,
        registration_deadline: data.registration_deadline,
        province: data.province,
        district: data.district,
        contact_phone: data.contact_phone,
        contact_email: data.contact_email,
        // Team registration settings
        max_teams: data.max_teams || 16,
        // Optional fields
        requires_approval: data.requires_approval !== undefined ? data.requires_approval : true,
        is_recurring: data.is_recurring || false,
        allow_individual_players: data.allow_individual_players !== undefined ? data.allow_individual_players : true,
        chat_enabled: data.chat_enabled !== undefined ? data.chat_enabled : true,
        visibility: data.visibility || 'public',
        tags: selectedTags || []
      };
      
      validateTournamentData(sanitizedData);
      
      // Fix date validation - compare only dates, not datetime
      const startDate = new Date(sanitizedData.start_date + 'T00:00:00');
      const endDate = new Date(sanitizedData.end_date + 'T00:00:00');
      const regDeadline = new Date(sanitizedData.registration_deadline + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      
      if (startDate.getTime() <= today.getTime()) {
        throw new Error('Start date must be in the future');
      }
      
      if (endDate.getTime() <= startDate.getTime()) {
        throw new Error('End date must be after start date');
      }
      
      if (regDeadline.getTime() >= startDate.getTime()) {
        throw new Error('Registration deadline must be before start date');
      }
      
      if (mapPosition) {
        sanitizedData.latitude = mapPosition[0];
        sanitizedData.longitude = mapPosition[1];
      }

      // Process uploaded files first (if any)
      let processedImageUrls: string[] = [];
      let processedPdfUrl: string | null = null;

      try {
        // Handle image uploads - upload to Supabase storage
        if (selectedImages.length > 0) {
          console.log('📸 Starting image upload process...');
          console.log('📸 Number of images to upload:', selectedImages.length);
          console.log('📸 Image details:', selectedImages.map(img => ({ name: img.name, size: img.size, type: img.type })));
          
          // Storage connection test bypassed - proceed directly to file upload
          console.log('🚀 Skipping storage connection test - proceeding directly to file upload...');
          
          console.log('📸 Uploading images to Supabase storage...');
          
          // Add timeout to prevent hanging uploads
          const uploadTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Image upload timeout - please try again')), 60000)
          );
          
          console.log('🚀 Calling uploadMultipleImages...');
          const uploadPromise = imageUploadService.uploadMultipleImages(selectedImages, 'tournament-images');
          const imageResults = await Promise.race([uploadPromise, uploadTimeoutPromise]) as any;
          
          console.log('📸 Upload results:', imageResults);
          
          const successfulUploads = imageResults.filter((result: any) => result.success);
          const failedUploads = imageResults.filter((result: any) => !result.success);
          
          if (successfulUploads.length > 0) {
            processedImageUrls = successfulUploads.map((result: any) => result.url).filter(Boolean);
            console.log('✅ Images uploaded successfully:', processedImageUrls.length);
            console.log('✅ Image URLs:', processedImageUrls);
          }
          
          if (failedUploads.length > 0) {
            console.error('❌ Failed uploads:', failedUploads);
            failedUploads.forEach((result: any, index: number) => {
              console.error(`❌ Failed upload ${index + 1}:`, result.error);
            });
            toast.error(`${failedUploads.length} images failed to upload`);
            setLoading(false);
            return;
          }
        } else {
          console.log('📸 No images selected for upload');
        }

        // Handle PDF upload - upload to Supabase storage
        if (selectedPDF) {
          console.log('📄 Uploading PDF to Supabase storage...');
          
          console.log('🚀 Calling uploadImage for PDF...');
          const pdfResult = await imageUploadService.uploadImage(selectedPDF, 'payment-proofs');
          
          if (pdfResult.success && pdfResult.url) {
            processedPdfUrl = pdfResult.url;
            console.log('✅ PDF uploaded successfully');
          } else {
            throw new Error(pdfResult.error || 'PDF upload failed');
          }
        }
      } catch (uploadError: any) {
        console.error('File upload error:', uploadError);
        
        if (uploadError.message.includes('timed out')) {
          toast.error('Storage connection timed out. Please check your Supabase configuration.');
        } else if (uploadError.message.includes('Storage connection failed')) {
          toast.error('Storage connection failed. Please check your Supabase configuration.');
        } else {
          toast.error('Failed to upload files. Please try again.');
        }
        
        // Ask user if they want to continue without file uploads
        const continueWithoutFiles = window.confirm(
          'File upload failed. Would you like to continue creating the tournament without images and PDF? You can add them later.'
        );
        
        if (continueWithoutFiles) {
          console.log('📝 Continuing without file uploads...');
          processedImageUrls = [];
          processedPdfUrl = null;
        } else {
          setLoading(false);
          return;
        }
      }

      // Calculate commission based on max teams (simplified for now)
      const commissionPercentage = 5; // 5% commission as defined in types
      
      // For now, calculate as per team since entry_fee_type is not in database
      const totalEntryFees = sanitizedData.entry_fee * sanitizedData.max_teams;
      
      const commissionAmount = (totalEntryFees * commissionPercentage) / 100;
      const organizerEarnings = totalEntryFees - commissionAmount;

      // Prepare tournament data for storage
      const tournamentData = {
        name: sanitizedData.name,
        description: sanitizedData.description,
        sport_type: sanitizedData.sport_type,
        tournament_type: sanitizedData.tournament_type,
        organizer_id: user?.id || '',
        organizer_name: user?.full_name || user?.email?.split('@')[0] || 'Unknown Organizer',
        facility_id: '', // Empty string instead of null
        facility_name: sanitizedData.venue_name,
        venue_name: sanitizedData.venue_name,
        venue_address: sanitizedData.venue_address,
        province: sanitizedData.province,
        district: sanitizedData.district,
        start_date: sanitizedData.start_date,
        end_date: sanitizedData.end_date,
        registration_deadline: sanitizedData.registration_deadline,
        entry_fee: sanitizedData.entry_fee,
        prize_pool: sanitizedData.prize_pool,
        rules: sanitizedData.rules,
        requirements: sanitizedData.requirements,
        contact_phone: sanitizedData.contact_phone,
        contact_email: sanitizedData.contact_email,
        latitude: sanitizedData.latitude,
        longitude: sanitizedData.longitude,
        images: processedImageUrls,
        pdf_document: processedPdfUrl || undefined,
        current_participants: 0,
        // New Playo.co fields
        requires_approval: sanitizedData.requires_approval,
        is_recurring: sanitizedData.is_recurring,
        max_teams: sanitizedData.max_teams,
        allow_individual_players: sanitizedData.allow_individual_players,
        chat_enabled: sanitizedData.chat_enabled,
        visibility: sanitizedData.visibility,
        tags: selectedTags,
        // Set status based on approval requirement
        status: (sanitizedData.requires_approval ? 'pending_approval' : 'active') as 'pending_approval' | 'active'
      };

      console.log('📝 Tournament data prepared for commission payment');

      // Store tournament data and commission info in localStorage for payment page
      const commissionData = {
        tournament_name: sanitizedData.name,
        entry_fee: sanitizedData.entry_fee,
        total_revenue: totalEntryFees,
        commission_percentage: commissionPercentage,
        commission_amount: commissionAmount,
        organizer_earnings: organizerEarnings,
        organizer_name: user?.full_name || user?.email?.split('@')[0] || 'Unknown Organizer',
        tournament_data: tournamentData
      };

      localStorage.setItem('pending_tournament_commission', JSON.stringify(commissionData));
      
      // Clear form data
      setSelectedImages([]);
      setSelectedPDF(null);
      setImagePreview([]);
      setSelectedTags([]);
      
      // Redirect to commission payment page
      toast.success('Tournament details prepared! Please complete the commission payment to activate your tournament.');
      navigate('/tournament-commission-payment');
      
    } catch (error) {
      console.error('Tournament preparation error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Supabase not connected')) {
          toast.error('Please connect to Supabase first. Click "Connect to Supabase" in the top right corner.');
        } else if (error.message.includes('validation')) {
          toast.error(`Validation error: ${error.message}`);
        } else {
          toast.error(`Failed to prepare tournament: ${error.message}`);
        }
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/organizer-dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Tournament</h1>
          <p className="text-gray-600">Fill out all the details and pay the platform commission to activate your tournament</p>
        </motion.div>

        {/* Single Page Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <SupabaseConnectionBanner />
          
          <Card className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic Information Section */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Info className="h-5 w-5 mr-2 text-blue-600" />
                  Basic Information
                </h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tournament Name *
                    </label>
                    <input
                      type="text"
                      {...register('name')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter tournament name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      {...register('description')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe your tournament..."
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sport/Game Type *
                    </label>
                    <select
                      {...register('sport_type')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a sport/game</option>
                      <optgroup label="Physical Sports">
                        {SPORTS_TYPES.filter(sport => 
                          !['Dota 2', 'League of Legends', 'Counter-Strike 2', 'Valorant', 'PUBG Mobile',
                           'Mobile Legends', 'Free Fire', 'Call of Duty', 'Fortnite', 'Apex Legends',
                           'Overwatch 2', 'FIFA', 'NBA 2K', 'Rocket League', 'Street Fighter',
                           'Tekken', 'Mortal Kombat', 'Chess.com', 'Clash Royale', 'Clash of Clans',
                           'Among Us', 'Fall Guys', 'Minecraft', 'Roblox', 'Genshin Impact'].includes(sport)
                        ).map(sport => (
                          <option key={sport} value={sport}>{sport}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Esports">
                        {['Dota 2', 'League of Legends', 'Counter-Strike 2', 'Valorant', 'PUBG Mobile',
                          'Mobile Legends', 'Free Fire', 'Call of Duty', 'Fortnite', 'Apex Legends',
                          'Overwatch 2', 'FIFA', 'NBA 2K', 'Rocket League', 'Street Fighter',
                          'Tekken', 'Mortal Kombat', 'Chess.com', 'Clash Royale', 'Clash of Clans',
                          'Among Us', 'Fall Guys', 'Minecraft', 'Roblox', 'Genshin Impact'].map(sport => (
                          <option key={sport} value={sport}>{sport}</option>
                        ))}
                      </optgroup>
                      <option value="custom">Custom Game</option>
                    </select>
                    {errors.sport_type && (
                      <p className="mt-1 text-sm text-red-600">{errors.sport_type.message}</p>
                    )}
                  </div>

                  {watch('sport_type') === 'custom' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Game Name *
                      </label>
                      <input
                        type="text"
                        {...register('custom_sport')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter custom game name"
                      />
                      {errors.custom_sport && (
                        <p className="mt-1 text-sm text-red-600">{errors.custom_sport.message}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tournament Format *
                    </label>
                    <select
                      {...register('tournament_type')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="single_elimination">Single Elimination</option>
                      <option value="double_elimination">Double Elimination</option>
                      <option value="round_robin">Round Robin</option>
                      <option value="swiss">Swiss System</option>
                      <option value="league">League Format</option>
                    </select>
                    {errors.tournament_type && (
                      <p className="mt-1 text-sm text-red-600">{errors.tournament_type.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Tournament Details Section */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-blue-600" />
                  Tournament Details
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      {...register('start_date')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.start_date && (
                      <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date *
                    </label>
                    <input
                      type="date"
                      {...register('end_date')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.end_date && (
                      <p className="mt-1 text-sm text-red-600">{errors.end_date.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Registration Deadline *
                    </label>
                    <input
                      type="date"
                      {...register('registration_deadline')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.registration_deadline && (
                      <p className="mt-1 text-sm text-red-600">{errors.registration_deadline.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Entry Fee (रू)
                    </label>
                    <input
                      type="number"
                      {...register('entry_fee', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                    {errors.entry_fee && (
                      <p className="mt-1 text-sm text-red-600">{errors.entry_fee.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prize Pool (रू)
                    </label>
                    <input
                      type="number"
                      {...register('prize_pool', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                    {errors.prize_pool && (
                      <p className="mt-1 text-sm text-red-600">{errors.prize_pool.message}</p>
                    )}
                  </div>
                </div>

                {/* Team Registration Settings */}
                <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Team Registration Settings
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Registration Mode *
                      </label>
                      <select
                        {...register('registration_mode')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="individual">Individual Players Only</option>
                        <option value="team">Teams Only</option>
                        <option value="hybrid">Both Individual & Teams</option>
                      </select>
                      {errors.registration_mode && (
                        <p className="mt-1 text-sm text-red-600">{errors.registration_mode.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Entry Fee Type *
                      </label>
                      <select
                        {...register('entry_fee_type')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="per_player">Per Player</option>
                        <option value="per_team">Per Team</option>
                      </select>
                      {errors.entry_fee_type && (
                        <p className="mt-1 text-sm text-red-600">{errors.entry_fee_type.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Teams *
                      </label>
                      <input
                        type="number"
                        {...register('max_teams', { valueAsNumber: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                        max="100"
                        placeholder="Enter max number of teams"
                      />
                      {errors.max_teams && (
                        <p className="mt-1 text-sm text-red-600">{errors.max_teams.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Min Team Size
                      </label>
                      <input
                        type="number"
                        {...register('team_size_min', { valueAsNumber: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                        max="50"
                      />
                      {errors.team_size_min && (
                        <p className="mt-1 text-sm text-red-600">{errors.team_size_min.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Team Size
                      </label>
                      <input
                        type="number"
                        {...register('team_size_max', { valueAsNumber: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                        max="50"
                      />
                      {errors.team_size_max && (
                        <p className="mt-1 text-sm text-red-600">{errors.team_size_max.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-blue-700 bg-blue-100 p-3 rounded-lg">
                    <p><strong>Registration Mode:</strong></p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li><strong>Individual:</strong> Players register one by one</li>
                      <li><strong>Team:</strong> Only teams can register (captains pay for entire team)</li>
                      <li><strong>Hybrid:</strong> Both individual players and teams can register</li>
                    </ul>
                    <p className="mt-2"><strong>Entry Fee Type:</strong></p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li><strong>Per Player:</strong> Each player pays the entry fee</li>
                      <li><strong>Per Team:</strong> Team captain pays one fee for the entire team</li>
                    </ul>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tournament Rules *
                    </label>
                    <textarea
                      {...register('rules')}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Specify the rules and regulations for your tournament..."
                    />
                    {errors.rules && (
                      <p className="mt-1 text-sm text-red-600">{errors.rules.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Participation Requirements *
                    </label>
                    <textarea
                      {...register('requirements')}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="What do participants need to bring or have to participate?"
                    />
                    {errors.requirements && (
                      <p className="mt-1 text-sm text-red-600">{errors.requirements.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      {...register('contact_phone')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+977-1-4567890"
                    />
                    {errors.contact_phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.contact_phone.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Email *
                    </label>
                    <input
                      type="email"
                      {...register('contact_email')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="tournament@example.com"
                    />
                    {errors.contact_email && (
                      <p className="mt-1 text-sm text-red-600">{errors.contact_email.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Location Section */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                  Location Details
                </h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Venue Name *
                    </label>
                    <input
                      type="text"
                      {...register('venue_name')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter venue name"
                    />
                    {errors.venue_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.venue_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Location
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Search for a location in Nepal..."
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), searchLocation())}
                      />
                      <Button
                        type="button"
                        onClick={searchLocation}
                        disabled={searchLoading || !searchQuery.trim()}
                        className="px-4"
                      >
                        {searchLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Venue Address *
                  </label>
                  <textarea
                    {...register('venue_address')}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter complete venue address"
                  />
                  {errors.venue_address && (
                    <p className="mt-1 text-sm text-red-600">{errors.venue_address.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Province *
                    </label>
                    <select
                      {...register('province')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Province</option>
                      {NEPAL_PROVINCES.map(province => (
                        <option key={province.id} value={province.name}>
                          {province.name}
                        </option>
                      ))}
                    </select>
                    {errors.province && (
                      <p className="mt-1 text-sm text-red-600">{errors.province.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      District *
                    </label>
                    <select
                      {...register('district')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!selectedProvince}
                    >
                      <option value="">Select District</option>
                      {selectedProvince && getDistrictsForProvince(selectedProvince).map(district => (
                        <option key={district} value={district}>
                          {district}
                        </option>
                      ))}
                    </select>
                    {errors.district && (
                      <p className="mt-1 text-sm text-red-600">{errors.district.message}</p>
                    )}
                  </div>
                </div>

                {/* Selected Location Display */}
                {locationAddress && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Selected Location:</p>
                        <p className="text-sm text-blue-700">{locationAddress}</p>
                        {mapPosition && (
                          <p className="text-xs text-blue-600 mt-1">
                            Coordinates: {mapPosition[0].toFixed(6)}, {mapPosition[1].toFixed(6)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Location on Map
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    Click on the map to mark the exact location of your tournament venue
                  </p>
                  
                  <div className="h-64 rounded-lg overflow-hidden border border-gray-300">
                    <MapContainer
                      center={mapPosition || [27.7172, 85.3240]}
                      zoom={13}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <LocationMarker 
                        position={mapPosition} 
                        setPosition={setMapPosition}
                        onLocationSelect={handleLocationSelect}
                      />
                    </MapContainer>
                  </div>
                </div>
              </div>

              {/* Media & Files Section */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Upload className="h-5 w-5 mr-2 text-blue-600" />
                  Media & Files (Optional)
                </h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tournament Images
                    </label>
                    <p className="text-sm text-gray-500 mb-3">
                      Upload up to 5 images. Maximum 5MB per image.
                    </p>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                      <input
                        ref={imageInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 text-sm mb-2">Click to upload images</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => imageInputRef.current?.click()}
                      >
                        Choose Images
                      </Button>
                    </div>

                    {/* Image Previews */}
                    {imagePreview.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {imagePreview.map((preview, index) => (
                          <div key={index} className="relative">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-20 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* PDF Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tournament Document
                    </label>
                    <p className="text-sm text-gray-500 mb-3">
                      Upload a PDF document with detailed tournament information. Maximum 10MB.
                    </p>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                      <input
                        ref={pdfInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handlePDFUpload}
                        className="hidden"
                      />
                      <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 text-sm mb-2">Click to upload PDF document</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => pdfInputRef.current?.click()}
                      >
                        Choose PDF
                      </Button>
                    </div>

                    {/* PDF Preview */}
                    {selectedPDF && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                        <div className="flex items-center">
                          <FileText className="h-6 w-6 text-red-500 mr-2" />
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{selectedPDF.name}</p>
                            <p className="text-xs text-gray-500">
                              {(selectedPDF.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={removePDF}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Advanced Options Section */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-blue-600" />
                  Advanced Options
                </h2>
                
                <div className="space-y-6">
                  {/* Approval Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <input
                        type="checkbox"
                        id="requires_approval"
                        {...register('requires_approval')}
                        checked={true}
                        disabled={true}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="requires_approval" className="text-sm font-medium text-blue-700">
                        ✓ Admin approval required (mandatory)
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="chat_enabled"
                        {...register('chat_enabled')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="chat_enabled" className="text-sm font-medium text-gray-700">
                        Enable in-app chat for participants
                      </label>
                    </div>
                  </div>

                  {/* Recurring Schedule */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="is_recurring"
                        {...register('is_recurring')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is_recurring" className="text-sm font-medium text-gray-700">
                        This is a recurring event
                      </label>
                    </div>

                    {isRecurring && (
                      <div className="ml-6 space-y-4 p-4 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Recurrence Type
                            </label>
                            <select
                              {...register('recurrence_type')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="weekly">Weekly</option>
                              <option value="monthly">Monthly</option>
                              <option value="daily">Daily</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Interval
                            </label>
                            <input
                              type="number"
                              {...register('recurrence_interval', { valueAsNumber: true })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              min="1"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Max Occurrences
                            </label>
                            <input
                              type="number"
                              {...register('max_occurrences', { valueAsNumber: true })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              min="1"
                              placeholder="Unlimited"
                            />
                          </div>
                        </div>

                        {recurrenceType === 'weekly' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Days of Week
                            </label>
                            <div className="grid grid-cols-7 gap-2">
                              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                                <label key={day} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    value={index}
                                    onChange={(e) => {
                                      const currentDays = watch('recurrence_days') || [];
                                      if (e.target.checked) {
                                        setValue('recurrence_days', [...currentDays, index]);
                                      } else {
                                        setValue('recurrence_days', currentDays.filter(d => d !== index));
                                      }
                                    }}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                  <span className="text-sm text-gray-600">{day}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {recurrenceType === 'monthly' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Day of Month
                            </label>
                            <input
                              type="number"
                              {...register('recurrence_day_of_month', { valueAsNumber: true })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              min="1"
                              max="31"
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Recurrence Start Time
                            </label>
                            <input
                              type="time"
                              {...register('recurrence_start_time')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Recurrence End Time
                            </label>
                            <input
                              type="time"
                              {...register('recurrence_end_time')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Recurrence End Date
                          </label>
                          <input
                            type="date"
                            {...register('recurrence_end_date')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedTags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => setSelectedTags(selectedTags.filter((_, i) => i !== index))}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add a tag..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const input = e.target as HTMLInputElement;
                            if (input.value.trim() && !selectedTags.includes(input.value.trim())) {
                              setSelectedTags([...selectedTags, input.value.trim()]);
                              input.value = '';
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const input = document.querySelector('input[placeholder="Add a tag..."]') as HTMLInputElement;
                          if (input.value.trim() && !selectedTags.includes(input.value.trim())) {
                            setSelectedTags([...selectedTags, input.value.trim()]);
                            input.value = '';
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t">
                {/* Revenue Calculator */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Projection</h3>
                  <PlatformFeeCalculator
                    entryFee={entryFee}
                    maxTeams={watch('max_teams') || 0}
                    teamSizeMax={watch('team_size_max') || 1}
                    entryFeeType={watch('entry_fee_type') || 'per_player'}
                    registrationMode={watch('registration_mode') || 'hybrid'}
                  />
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> A 5% platform commission will be charged when you create this tournament. 
                      You'll be redirected to the payment page after form submission.
                    </p>
                  </div>
                </div>
                
                {/* Submit Section */}
                <div className="flex flex-col justify-end">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-blue-900 mb-2">Platform Benefits</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Secure payment processing</li>
                      <li>• Participant management tools</li>
                      <li>• Marketing and promotion</li>
                      <li>• 24/7 customer support</li>
                      {!requiresApproval && <li>• Instant tournament activation</li>}
                      {isRecurring && <li>• Automated recurring schedule management</li>}
                    </ul>
                  </div>
                  
                  <Button 
                    type="submit" 
                    loading={loading}
                    size="lg"
                    className="w-full"
                  >
                    {loading ? 'Preparing Tournament...' : 'Continue to Payment'}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};