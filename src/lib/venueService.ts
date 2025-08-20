import { supabase } from './supabase';

// Super simple venue service - just works!
export const venueService = {
  // Get all active venues for public viewing
  async getAllVenues() {
    try {
      // Try to get venues with is_active filter first
      let { data, error } = await supabase
        .from('sports_facilities')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // If no results or error, try without the filter
      if (error || !data || data.length === 0) {
        console.log('No active venues found, trying without is_active filter...');
        const { data: allData, error: allError } = await supabase
          .from('sports_facilities')
          .select('*')
          .order('created_at', { ascending: false });

        if (allError) throw allError;
        return allData || [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting venues:', error);
      return [];
    }
  },

  // Get venue by ID for public viewing
  async getVenueById(id: string) {
    try {
      // First try to get the venue without the is_active filter
      let { data, error } = await supabase
        .from('sports_facilities')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error getting venue by ID:', error);
        return null;
      }

      // If venue exists but is not active, still return it (for admin viewing)
      if (data) {
        return data;
      }

      return null;
    } catch (error) {
      console.error('Error getting venue:', error);
      return null;
    }
  },

  // Get featured venues for homepage
  async getFeaturedVenues(limit: number = 6) {
    try {
      // Try to get venues with is_active filter first
      let { data, error } = await supabase
        .from('sports_facilities')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .limit(limit);

      // If no results or error, try without the filter
      if (error || !data || data.length === 0) {
        console.log('No active featured venues found, trying without is_active filter...');
        const { data: allData, error: allError } = await supabase
          .from('sports_facilities')
          .select('*')
          .order('rating', { ascending: false })
          .limit(limit);

        if (allError) throw allError;
        return allData || [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting featured venues:', error);
      return [];
    }
  },

  // Add new venue (admin only) - SUPER SIMPLE!
  async addVenueManually(venueData: {
    name: string;
    description: string;
    location: string;
    district: string;
    province: string;
    googleMapsLink: string;
    sports_types: string[];
    amenities: string[];
    price_per_hour: number;
    contact_phone: string;
    contact_email?: string;
    images: string[];
    notes?: string;
  }) {
    try {
      console.log('🔄 Adding venue:', venueData.name);
      console.log('📊 Venue data received:', venueData);

      // Simple data preparation
      const venueToInsert = {
        name: venueData.name,
        description: venueData.description,
        location: venueData.location,
        district: venueData.district,
        province: venueData.province,
        google_maps_link: venueData.googleMapsLink,
        sports_types: venueData.sports_types && venueData.sports_types.length > 0 ? venueData.sports_types : [],
        amenities: venueData.amenities && venueData.amenities.length > 0 ? venueData.amenities : [],
        price_per_hour: venueData.price_per_hour,
        contact_phone: venueData.contact_phone,
        contact_email: venueData.contact_email || null,
        images: venueData.images && venueData.images.length > 0 ? venueData.images : [],
        owner_id: null,
        source: 'manual',
        notes: venueData.notes || null,
        rating: 0,
        total_reviews: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('📤 Data prepared for insert:', venueToInsert);
      console.log('🔍 About to call Supabase insert...');

      const { data, error } = await supabase
        .from('sports_facilities')
        .insert([venueToInsert])
        .select()
        .single();

      console.log('📥 Supabase response received');
      console.log('📊 Data:', data);
      console.log('❌ Error:', error);

      if (error) {
        console.error('❌ Insert failed:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('✅ Venue added successfully:', data.name);
      return data;
    } catch (error: any) {
      console.error('❌ Venue creation failed:', error);
      console.error('❌ Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
      throw error;
    }
  },

  // Update venue (admin only)
  async updateVenue(id: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('sports_facilities')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating venue:', error);
      throw error;
    }
  },

  // Deactivate venue (admin only)
  async deactivateVenue(id: string) {
    try {
      const { error } = await supabase
        .from('sports_facilities')
        .update({ 
          is_active: false, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deactivating venue:', error);
      throw error;
    }
  },

  // Get all venues including inactive (admin view)
  async getAllVenuesAdmin() {
    try {
      const { data, error } = await supabase
        .from('sports_facilities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting admin venues:', error);
      return [];
    }
  },

  // Get venue statistics (admin only)
  async getVenueStats() {
    try {
      const { data: venues, error } = await supabase
        .from('sports_facilities')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      const totalVenues = venues?.length || 0;
      const totalProvinces = new Set(venues?.map(v => v.province) || []).size;
      const totalDistricts = new Set(venues?.map(v => v.district) || []).size;
      const averageRating = venues && venues.length > 0 
        ? venues.reduce((sum, v) => sum + v.rating, 0) / venues.length 
        : 0;

      return {
        totalVenues,
        totalProvinces,
        totalDistricts,
        averageRating: Math.round(averageRating * 100) / 100
      };
    } catch (error) {
      console.error('Error getting venue stats:', error);
      return {
        totalVenues: 0,
        totalProvinces: 0,
        totalDistricts: 0,
        averageRating: 0
      };
    }
  }
};

// Export services for different use cases
export const venueDiscoveryService = {
  getAll: venueService.getAllVenues,
  getById: venueService.getVenueById,
  getFeatured: venueService.getFeaturedVenues
};

export const venueAdminService = {
  addManually: venueService.addVenueManually,
  update: venueService.updateVenue,
  deactivate: venueService.deactivateVenue,
  getAll: venueService.getAllVenuesAdmin,
  getStats: venueService.getVenueStats
};
