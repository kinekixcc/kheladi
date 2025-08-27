import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Phone, Mail, Plus, Save, Upload, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { imageUploadService } from '../../lib/imageUpload';

interface AddVenueFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddVenueForm: React.FC<AddVenueFormProps> = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    district: '',
    province: '',
    location: '',
    contact_phone: '',
    contact_email: '',
    price_per_hour: 0
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [skipImages, setSkipImages] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || user.role !== 'admin') {
      toast.error('Only administrators can add venues');
      return;
    }

    if (!formData.name || !formData.district || !formData.province) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);

              // Upload images to Supabase storage if any (unless skipped)
        let imageUrls: string[] = [];
        if (selectedFiles.length > 0 && !skipImages) {
          console.log('📸 Uploading images to Supabase storage...');
          
          try {
            const uploadResults = await imageUploadService.uploadMultipleImages(selectedFiles, 'venue-images');
            
            const successfulUploads = uploadResults.filter(result => result.success);
            const failedUploads = uploadResults.filter(result => !result.success);
            
            if (successfulUploads.length > 0) {
              imageUrls = successfulUploads.map(result => result.url!).filter(Boolean);
              console.log('✅ Images uploaded successfully:', imageUrls.length);
            }
            
            if (failedUploads.length > 0) {
              console.error('❌ Failed uploads:', failedUploads);
              toast.error(`${failedUploads.length} images failed to upload`);
              setIsSubmitting(false);
              return;
            }
          } catch (error) {
            console.error('❌ Image upload error:', error);
            toast.error('Failed to upload images. Please try again.');
            setIsSubmitting(false);
            return;
          }
        }

      console.log('🏟️ Creating simple venue data...');

      // Create venue data with ONLY fields that exist in the database
      const venueData = {
        name: formData.name,
        description: formData.description,
        district: formData.district,
        province: formData.province,
        location: formData.location,
        contact_phone: formData.contact_phone,
        contact_email: formData.contact_email,
        price_per_hour: formData.price_per_hour,
        images: imageUrls,
        sports_types: ['General'], // Default sport type
        amenities: [], // Empty amenities for now
        rating: 0,
        total_reviews: 0,
        is_active: true
      };

      console.log('🏟️ Inserting venue with data:', venueData);
      console.log('🔍 Database fields being sent:', Object.keys(venueData));
      
      const { data, error } = await supabase
        .from('sports_facilities')
        .insert([venueData])
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        toast.error(`Failed to add venue: ${error.message}`);
        return;
      }

      console.log('✅ Venue created successfully:', data);
      toast.success('Venue added successfully!');
      onSuccess?.();
      onClose();

    } catch (error) {
      console.error('Error adding venue:', error);
      toast.error('Failed to add venue. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
            // Filter files by size (5MB limit for Supabase storage)
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast.error(`${file.name} is too large. Please use images under 5MB.`);
        return false;
      }
      return true;
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Add New Venue</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue Name *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Central Sports Complex"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  District *
                </label>
                <Input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="e.g., Kathmandu"
                  required
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the venue..."
              />
            </div>
          </Card>

          {/* Location & Contact */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Location & Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Province *
                </label>
                <Input
                  type="text"
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  placeholder="e.g., Bagmati Province"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location/Address
                </label>
                <Input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Near Central Park"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Phone
                </label>
                <Input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="contact@venue.com"
                />
              </div>
            </div>
          </Card>

          {/* Pricing */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Pricing</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price per Hour (NPR)
              </label>
              <Input
                type="number"
                value={formData.price_per_hour}
                onChange={(e) => setFormData({ ...formData, price_per_hour: Number(e.target.value) })}
                placeholder="500"
                min="0"
              />
            </div>
          </Card>

          {/* Photo Upload */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Venue Photos</h3>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={skipImages}
                  onChange={(e) => setSkipImages(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Skip images (add later)
              </label>
            </div>
            <div className="space-y-4">
              {/* File Input */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="venue-photos"
                />
                <label htmlFor="venue-photos" className="cursor-pointer">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">
                    <span className="text-blue-600 hover:text-blue-800">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-sm text-gray-500 mt-1">PNG, JPG, GIF up to 5MB each</p>
                </label>
              </div>

              {/* Selected Files Preview */}
              {selectedFiles.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {selectedFiles.length > 0 ? 'Converting Images & Adding Venue...' : 'Adding Venue...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Add Venue
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
