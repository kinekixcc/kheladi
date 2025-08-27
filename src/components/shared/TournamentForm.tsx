import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { 
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
import { validateTournamentData, sanitizeInput } from '../../utils/dataValidation';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { PlatformFeeCalculator } from '../monetization/PlatformFeeCalculator';
import { SPORTS_TYPES, NEPAL_PROVINCES } from '../../types';
import { imageUploadService } from '../../lib/imageUpload';

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
  custom_sport: z.string().optional(),
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
  max_teams: z.number().min(1).default(16),
  requires_approval: z.boolean().default(true),
  is_recurring: z.boolean().default(false),
  allow_individual_players: z.boolean().default(true),
  chat_enabled: z.boolean().default(true),
  visibility: z.enum(['public', 'private', 'invite_only']).default('public'),
  tags: z.array(z.string()).default([]),
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
}

const LocationMarker: React.FC<LocationMarkerProps> = ({ position }) => {
  if (!position) return null;
  return <Marker position={position} />;
};

interface TournamentFormProps {
  initialData?: any;
  onSubmit: (data: TournamentForm, files: { images: File[], pdf: File | null }) => Promise<void>;
  isEditing?: boolean;
  loading?: boolean;
}

export const TournamentForm: React.FC<TournamentFormProps> = ({
  initialData,
  onSubmit,
  isEditing = false,
  loading = false
}) => {
  const [mapPosition, setMapPosition] = useState<[number, number] | null>([27.7172, 85.3240]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedPDF, setSelectedPDF] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [locationAddress, setLocationAddress] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchLoading, setSearchLoading] = useState(false);
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
      requires_approval: true,
      is_recurring: false,
      max_teams: 16,
      allow_individual_players: true,
      chat_enabled: true,
      visibility: 'public',
      tags: [],
      recurrence_interval: 1,
      ...initialData
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

  useEffect(() => {
    if (initialData) {
      // Set form values from initial data
      Object.keys(initialData).forEach(key => {
        if (initialData[key] !== undefined) {
          setValue(key as keyof TournamentForm, initialData[key]);
        }
      });
      
      // Set location if available
      if (initialData.latitude && initialData.longitude) {
        setMapPosition([initialData.latitude, initialData.longitude]);
      }
      
      // Set existing images if editing
      if (initialData.images) {
        setImagePreview(initialData.images);
      }
      
      // Set existing tags if editing
      if (initialData.tags) {
        setSelectedTags(initialData.tags);
      }
    }
  }, [initialData, setValue]);

  const handleFormSubmit = async (data: TournamentForm) => {
    await onSubmit(data, { images: selectedImages, pdf: selectedPDF });
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      setSelectedImages(prev => [...prev, ...imageFiles]);
      
      // Create previews
      imageFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  const handlePDFSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedPDF(file);
    }
  };

  const removePDF = () => {
    setSelectedPDF(null);
    if (pdfInputRef.current) {
      pdfInputRef.current.value = '';
    }
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !selectedTags.includes(tag.trim())) {
      setSelectedTags([...selectedTags, tag.trim()]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* Basic Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Trophy className="h-5 w-5 mr-2 text-blue-600" />
          Basic Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sport Type *
            </label>
            <select
              {...register('sport_type')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onChange={(e) => {
                setValue('sport_type', e.target.value);
                setShowCustomSport(e.target.value === 'custom');
              }}
            >
              <option value="">Select sport</option>
              {SPORTS_TYPES.map(sport => (
                <option key={sport} value={sport}>{sport}</option>
              ))}
              <option value="custom">Custom Game</option>
            </select>
            {errors.sport_type && (
              <p className="mt-1 text-sm text-red-600">{errors.sport_type.message}</p>
            )}
          </div>

          {showCustomSport && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Sport Name *
              </label>
              <input
                type="text"
                {...register('custom_sport')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter custom sport name"
              />
              {errors.custom_sport && (
                <p className="mt-1 text-sm text-red-600">{errors.custom_sport.message}</p>
              )}
            </div>
          )}

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe your tournament..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Schedule */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-green-600" />
          Schedule
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      </Card>

      {/* Venue Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-red-600" />
          Venue Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              Province *
            </label>
            <select
              {...register('province')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select province</option>
              {NEPAL_PROVINCES.map(province => (
                <option key={province.name} value={province.name}>{province.name}</option>
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
              <option value="">Select district</option>
              {selectedProvince && getDistrictsForProvince(selectedProvince).map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
            {errors.district && (
              <p className="mt-1 text-sm text-red-600">{errors.district.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Venue Address *
            </label>
            <textarea
              {...register('venue_address')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter complete venue address"
            />
            {errors.venue_address && (
              <p className="mt-1 text-sm text-red-600">{errors.venue_address.message}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Financial Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-yellow-600" />
          Financial Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Entry Fee (रू) *
            </label>
            <input
              type="number"
              {...register('entry_fee', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
              min="0"
            />
            {errors.entry_fee && (
              <p className="mt-1 text-sm text-red-600">{errors.entry_fee.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prize Pool (रू) *
            </label>
            <input
              type="number"
              {...register('prize_pool', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
              min="0"
            />
            {errors.prize_pool && (
              <p className="mt-1 text-sm text-red-600">{errors.prize_pool.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Teams *
            </label>
            <input
              type="number"
              {...register('max_teams', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="16"
              min="1"
              max="100"
            />
            {errors.max_teams && (
              <p className="mt-1 text-sm text-red-600">{errors.max_teams.message}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Rules & Requirements */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <FileText className="h-5 w-5 mr-2 text-indigo-600" />
          Rules & Requirements
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tournament Rules *
            </label>
            <textarea
              {...register('rules')}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter tournament rules..."
            />
            {errors.rules && (
              <p className="mt-1 text-sm text-red-600">{errors.rules.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requirements *
            </label>
            <textarea
              {...register('requirements')}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter participant requirements..."
            />
            {errors.requirements && (
              <p className="mt-1 text-sm text-red-600">{errors.requirements.message}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Contact Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Users className="h-5 w-5 mr-2 text-purple-600" />
          Contact Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Phone *
            </label>
            <input
              type="tel"
              {...register('contact_phone')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+977-XXXXXXXXX"
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
              placeholder="contact@example.com"
            />
            {errors.contact_email && (
              <p className="mt-1 text-sm text-red-600">{errors.contact_email.message}</p>
            )}
          </div>
        </div>
      </Card>

      {/* File Uploads */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Upload className="h-5 w-5 mr-2 text-blue-600" />
          Files & Media
        </h3>
        
        <div className="space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tournament Images
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={imageInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => imageInputRef.current?.click()}
                className="mb-4"
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Select Images
              </Button>
              <p className="text-sm text-gray-500">Upload up to 5 images (JPG, PNG, GIF)</p>
            </div>
            
            {/* Image Previews */}
            {imagePreview.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {imagePreview.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
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
              Tournament Rules PDF (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={pdfInputRef}
                type="file"
                accept=".pdf"
                onChange={handlePDFSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => pdfInputRef.current?.click()}
                className="mb-4"
              >
                <FileText className="h-4 w-4 mr-2" />
                Select PDF
              </Button>
              <p className="text-sm text-gray-500">Upload tournament rules or additional information</p>
            </div>
            
            {selectedPDF && (
              <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">{selectedPDF.name}</span>
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
      </Card>

      {/* Revenue Calculator */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-green-600" />
          Revenue Projection
        </h3>
        
        <PlatformFeeCalculator
          entryFee={entryFee}
          maxTeams={watch('max_teams') || 0}
          teamSizeMax={6}
          entryFeeType="per_team"
          registrationMode="team"
        />
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
        >
          {loading ? 'Processing...' : isEditing ? 'Update Tournament' : 'Create Tournament'}
        </Button>
      </div>
    </form>
  );
};


