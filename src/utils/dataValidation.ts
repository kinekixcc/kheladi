import { z } from 'zod';

// Tournament validation schema
export const tournamentValidationSchema = z.object({
  name: z.string()
    .min(3, 'Tournament name must be at least 3 characters')
    .max(100, 'Tournament name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_.,!]+$/, 'Tournament name contains invalid characters'),
  
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  
  sport_type: z.string()
    .min(1, 'Sport type is required'),
  
  tournament_type: z.enum(['single_elimination', 'double_elimination', 'round_robin', 'swiss', 'league'])
    .default('single_elimination'),
  
  entry_fee: z.number()
    .min(0, 'Entry fee cannot be negative')
    .max(100000, 'Entry fee cannot exceed रू 100,000'),
  
  prize_pool: z.number()
    .min(0, 'Prize pool cannot be negative')
    .max(1000000, 'Prize pool cannot exceed रू 1,000,000'),
  
  max_participants: z.number()
    .min(2, 'Minimum 2 participants required')
    .max(1000, 'Maximum 1000 participants allowed'),
  
  max_teams: z.number()
    .min(2, 'Minimum 2 teams required')
    .max(100, 'Maximum 100 teams allowed'),
  
  team_size: z.number()
    .min(1, 'Team size must be at least 1')
    .max(20, 'Team size cannot exceed 20'),
  
  start_date: z.string()
    .min(1, 'Start date is required'),
  
  end_date: z.string()
    .min(1, 'End date is required'),
  
  registration_deadline: z.string()
    .min(1, 'Registration deadline is required'),
  
  venue_name: z.string()
    .min(1, 'Venue name is required'),
  
  venue_address: z.string()
    .min(1, 'Venue address is required'),
  
  province: z.string()
    .min(1, 'Province is required'),
  
  district: z.string()
    .min(1, 'District is required'),
  
  rules: z.string()
    .min(20, 'Rules must be at least 20 characters')
    .max(2000, 'Rules must be less than 2000 characters'),
  
  requirements: z.string()
    .min(10, 'Requirements must be at least 10 characters')
    .max(1000, 'Requirements must be less than 1000 characters'),
  
  contact_phone: z.string()
    .regex(/^(\+977)?[0-9]{10}$/, 'Invalid Nepali phone number format'),
  
  contact_email: z.string()
    .email('Invalid email address'),
  
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  
  // Admin approval is mandatory
  requires_approval: z.boolean().default(true),
  
  // Optional fields
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

// Registration validation schema
export const registrationValidationSchema = z.object({
  player_name: z.string()
    .min(2, 'Player name must be at least 2 characters')
    .max(50, 'Player name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Player name can only contain letters and spaces'),
  
  email: z.string()
    .email('Invalid email address'),
  
  phone: z.string()
    .regex(/^(\+977)?[0-9]{10}$/, 'Invalid Nepali phone number format'),
  
  age: z.number()
    .min(13, 'Must be at least 13 years old')
    .max(100, 'Invalid age'),
  
  emergency_contact: z.string()
    .regex(/^(\+977)?[0-9]{10}$/, 'Invalid emergency contact number')
});

// User profile validation schema
export const profileValidationSchema = z.object({
  full_name: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  
  phone: z.string()
    .regex(/^(\+977)?[0-9]{10}$/, 'Invalid Nepali phone number format')
    .optional(),
  
  bio: z.string()
    .max(500, 'Bio must be less than 500 characters')
    .optional(),
  
  location: z.string()
    .max(100, 'Location must be less than 100 characters')
    .optional()
});

// Rating validation schema
export const ratingValidationSchema = z.object({
  rating: z.number()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),
  
  review: z.string()
    .max(1000, 'Review must be less than 1000 characters')
    .optional()
});

// Sanitization functions
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

export const sanitizePhoneNumber = (phone: string): string => {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Ensure Nepal format
  if (cleaned.startsWith('977')) {
    return '+' + cleaned;
  } else if (cleaned.startsWith('+977')) {
    return cleaned;
  } else if (cleaned.length === 10) {
    return '+977' + cleaned;
  }
  
  return cleaned;
};

export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

// Validation helpers
export const validateTournamentData = (data: any) => {
  try {
    return tournamentValidationSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors.map(e => e.message).join(', '));
    }
    throw error;
  }
};

export const validateRegistrationData = (data: any) => {
  try {
    return registrationValidationSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors.map(e => e.message).join(', '));
    }
    throw error;
  }
};

export const validateProfileData = (data: any) => {
  try {
    return profileValidationSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors.map(e => e.message).join(', '));
    }
    throw error;
  }
};

export const validateRatingData = (data: any) => {
  try {
    return ratingValidationSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors.map(e => e.message).join(', '));
    }
    throw error;
  }
};