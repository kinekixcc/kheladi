import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, MapPin, Search, Edit, Trash2, Eye, EyeOff, Star, DollarSign, Users, Upload, X, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { venueAdminService, venueDiscoveryService } from '../../lib/venueService';
import { supabase, testSupabaseConnection } from '../../lib/supabase';
import { imageUploadService } from '../../lib/imageUpload';
import { SportsFacility } from '../../types';
import { NEPAL_PROVINCES, SPORTS_TYPES, AMENITIES } from '../../types';

export const VenueManagement: React.FC = () => {
  const [venues, setVenues] = useState<SportsFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVenue, setEditingVenue] = useState<SportsFacility | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState({
    totalVenues: 0,
    totalProvinces: 0,
    totalDistricts: 0,
    averageRating: 0
  });

  // Image upload state
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    district: '',
    province: '',
    googleMapsLink: '',
    sports_types: [] as string[],
    amenities: [] as string[],
    price_per_hour: '',
    contact_phone: '',
    contact_email: '',
    images: [] as string[],
    source: 'google_maps' as 'google_maps' | 'manual' | 'venue_registration',
    notes: ''
  });

  useEffect(() => {
    loadVenues();
    loadStats();
  }, []);

  const loadVenues = async () => {
    setLoading(true);
    try {
      const data = await venueAdminService.getAll();
      setVenues(data);
    } catch (error) {
      console.error('Error loading venues:', error);
      toast.error('Failed to load venues');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const venueStats = await venueAdminService.getStats();
      setStats(venueStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmitting) {
      console.log('🚫 Form already submitting, ignoring...');
      return;
    }
    
    console.log('🎯 Submitting venue form...');
    
    // Validate required fields
    if (!formData.name || !formData.description || !formData.location || 
        !formData.district || !formData.province || !formData.price_per_hour || 
        !formData.contact_phone || formData.sports_types.length === 0 ||
        !formData.googleMapsLink) {
      toast.error('Please fill in all required fields including Google Maps link and at least one sport type');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const venueData = {
        ...formData,
        price_per_hour: parseFloat(formData.price_per_hour),
        sports_types: formData.sports_types,
        amenities: formData.amenities,
        images: [...formData.images, ...imageUrls] // Combine existing and new images
      };

      console.log('📤 Sending venue data:', venueData);

      if (editingVenue) {
        console.log('🔄 Updating venue...');
        await venueAdminService.update(editingVenue.id, venueData as any);
        console.log('✅ Venue updated successfully');
        toast.success('Venue updated successfully!');
      } else {
        console.log('🔄 Adding new venue...');
        const result = await venueAdminService.addManually(venueData as any);
        console.log('✅ Venue added successfully', result);
        toast.success('Venue added successfully!');
      }

      setShowAddForm(false);
      setEditingVenue(null);
      resetForm();
      await loadVenues();
      await loadStats();
      
    } catch (error: any) {
      console.error('❌ Error saving venue:', error);
      toast.error(editingVenue ? 'Failed to update venue' : 'Failed to add venue');
      if (error?.message) {
        toast.error(error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (venue: SportsFacility) => {
    setEditingVenue(venue);
    setFormData({
      name: venue.name,
      description: venue.description,
      location: venue.location,
      district: venue.district,
      province: venue.province,
      googleMapsLink: venue.googleMapsLink || '',
      sports_types: venue.sports_types,
      amenities: venue.amenities,
      price_per_hour: venue.price_per_hour.toString(),
      contact_phone: venue.contact_phone,
      contact_email: venue.contact_email || '',
      images: venue.images,
      source: 'manual',
      notes: ''
    });
    setImageUrls(venue.images || []);
    setImageFiles([]);
    setShowAddForm(true);
  };

  const handleDeactivate = async (venueId: string) => {
    if (window.confirm('Are you sure you want to deactivate this venue?')) {
      try {
        await venueAdminService.deactivate(venueId);
        toast.success('Venue deactivated successfully');
        loadVenues();
        loadStats();
      } catch (error) {
        console.error('Error deactivating venue:', error);
        toast.error('Failed to deactivate venue');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      location: '',
      district: '',
      province: '',
      googleMapsLink: '',
      sports_types: [],
      amenities: [],
      price_per_hour: '',
      contact_phone: '',
      contact_email: '',
      images: [],
      source: 'google_maps',
      notes: ''
    });
    setImageFiles([]);
    setImageUrls([]);
  };

  // Image upload functions
  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const newFiles = Array.from(files);
    const validFiles = newFiles.filter(file => 
      file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024 // 5MB limit
    );
    
    if (validFiles.length !== newFiles.length) {
      toast.error('Some files were invalid. Only images under 5MB are allowed.');
    }
    
    if (validFiles.length === 0) return;
    
    setImageFiles(prev => [...prev, ...validFiles]);
    
    // Upload images using the image upload service
    try {
      setUploadingImages(true);
      const results = await imageUploadService.uploadMultipleImages(validFiles);
      
      const successfulUploads = results.filter(result => result.success);
      const failedUploads = results.filter(result => !result.success);
      
      if (successfulUploads.length > 0) {
        const newUrls = successfulUploads.map(result => result.url!).filter(Boolean);
        setImageUrls(prev => [...prev, ...newUrls]);
        toast.success(`Successfully uploaded ${successfulUploads.length} images`);
      }
      
      if (failedUploads.length > 0) {
        toast.error(`Failed to upload ${failedUploads.length} images`);
        failedUploads.forEach(result => {
          if (result.error) {
            console.error('Upload error:', result.error);
          }
        });
      }
      
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleImageUpload(e.dataTransfer.files);
  };

  const filteredVenues = venues.filter(venue => {
    const matchesSearch = venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         venue.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProvince = !selectedProvince || venue.province === selectedProvince;
    return matchesSearch && matchesProvince;
  });



  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Venue Management</h1>
              <p className="text-gray-600">Manually add and manage sports venues from Google Maps</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={async () => {
                  try {
                    console.log('🧪 Testing Supabase connection...');
                    const result = await testSupabaseConnection();
                    if (result.success) {
                      toast.success('Supabase connection working!');
                    } else {
                      toast.error(`Connection failed: ${result.error?.message || 'Unknown error'}`);
                    }
                  } catch (err: any) {
                    console.error('❌ Connection test error:', err);
                    toast.error('Connection test failed');
                  }
                }}
                variant="outline"
                className="border-orange-500 text-orange-600 hover:bg-orange-50"
              >
                Test Connection
              </Button>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Venue from Google Maps
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Venues</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalVenues}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <MapPin className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Provinces</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProvinces}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <MapPin className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Districts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDistricts}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageRating}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Search venues..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Provinces</option>
                {NEPAL_PROVINCES.map(province => (
                  <option key={province.id} value={province.name}>
                    {province.name}
                  </option>
                ))}
              </select>
            </div>
          </Card>
        </motion.div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingVenue ? 'Edit Venue' : 'Add New Venue from Google Maps'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Venue Name *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      placeholder="e.g., Kathmandu Sports Complex"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      required
                      placeholder="e.g., Thamel, Kathmandu"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe the venue, facilities, and what makes it special..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Province *
                    </label>
                    <select
                      value={formData.province}
                      onChange={(e) => setFormData({...formData, province: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Province</option>
                      {NEPAL_PROVINCES.map(province => (
                        <option key={province.id} value={province.name}>
                          {province.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      District *
                    </label>
                    <Input
                      value={formData.district}
                      onChange={(e) => setFormData({...formData, district: e.target.value})}
                      required
                      placeholder="e.g., Kathmandu"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price per Hour (NPR) *
                    </label>
                    <Input
                      type="number"
                      value={formData.price_per_hour}
                      onChange={(e) => setFormData({...formData, price_per_hour: e.target.value})}
                      required
                      placeholder="1500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Google Maps Link *
                  </label>
                  <Input
                    type="text"
                    value={formData.googleMapsLink}
                    onChange={(e) => setFormData({...formData, googleMapsLink: e.target.value})}
                    placeholder="https://maps.app.goo.gl/... or just paste any Google Maps link"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Paste any Google Maps link. Players will be able to click this link to view the venue location.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sports Types *
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                      {SPORTS_TYPES.map(sport => (
                        <label key={sport} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.sports_types.includes(sport)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  sports_types: [...prev.sports_types, sport]
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  sports_types: prev.sports_types.filter(s => s !== sport)
                                }));
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">{sport}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amenities
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                      {AMENITIES.map(amenity => (
                        <label key={amenity} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.amenities.includes(amenity)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  amenities: [...prev.amenities, amenity]
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  amenities: prev.amenities.filter(a => a !== amenity)
                                }));
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">{amenity}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Phone *
                    </label>
                    <Input
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                      required
                      placeholder="+977-1-4444444"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Email
                    </label>
                    <Input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                      placeholder="info@venue.com"
                    />
                  </div>
                </div>

                {/* Image Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Venue Photos
                  </label>
                  <div className="space-y-4">
                    {/* Drag & Drop Area */}
                    <div
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 5MB each
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e.target.files)}
                        className="hidden"
                      />
                    </div>

                    {/* Image Preview Grid */}
                    {(imageFiles.length > 0 || imageUrls.length > 0) && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Local file previews */}
                        {imageFiles.map((file, index) => (
                          <div key={`file-${index}`} className="relative group">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        
                        {/* Existing image URLs */}
                        {imageUrls.map((url, index) => (
                          <div key={`url-${index}`} className="relative group">
                            <img
                              src={url}
                              alt={`Venue ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload Progress */}
                    {uploadingImages && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        Uploading images...
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Notes about the venue, source, or any special information..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingVenue(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {editingVenue ? 'Updating...' : 'Adding...'}
                      </div>
                    ) : (
                      editingVenue ? 'Update Venue' : 'Add Venue'
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}

        {/* Venues List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">All Venues ({filteredVenues.length})</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading venues...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Venue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Photos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sports
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rating
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredVenues.map((venue) => (
                      <tr key={venue.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{venue.name}</div>
                            <div className="text-sm text-gray-500">{venue.description.substring(0, 50)}...</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {venue.images && venue.images.length > 0 ? (
                              <>
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                                  <img
                                    src={venue.images[0]}
                                    alt={venue.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                    }}
                                  />
                                </div>
                                {venue.images.length > 1 && (
                                  <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                                    +{venue.images.length - 1}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-sm text-gray-900">{venue.district}, {venue.province}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {venue.sports_types.slice(0, 2).map((sport, idx) => (
                              <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {sport}
                              </span>
                            ))}
                            {venue.sports_types.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{venue.sports_types.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          रू {venue.price_per_hour}/hr
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-900">{venue.rating}</span>
                            <span className="text-sm text-gray-500 ml-1">({venue.total_reviews})</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            venue.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {venue.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(venue)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeactivate(venue.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
