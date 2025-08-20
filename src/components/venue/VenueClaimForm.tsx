import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Phone, Mail, FileText, MessageSquare, Send, Upload } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { venueWorkflowService } from '../../lib/venueWorkflowService';
import { SportsFacility } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { imageUploadService } from '../../lib/imageUpload';
import toast from 'react-hot-toast';

interface VenueClaimFormProps {
  venue: SportsFacility;
  onClose: () => void;
  onSuccess?: () => void;
}

export const VenueClaimForm: React.FC<VenueClaimFormProps> = ({ venue, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [formData, setFormData] = useState({
    contact_name: user?.full_name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    proof_url: '',
    message: ''
  });

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB');
      return;
    }

    try {
      setUploadingProof(true);
      const result = await imageUploadService.uploadImage(file);
      
      if (result.success && result.url) {
        setFormData({ ...formData, proof_url: result.url });
        toast.success('Proof document uploaded successfully');
      } else {
        toast.error('Failed to upload proof document');
      }
    } catch (error) {
      console.error('Error uploading proof:', error);
      toast.error('Failed to upload proof document');
    } finally {
      setUploadingProof(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in to submit a claim request');
      return;
    }

    if (!formData.contact_name || !formData.phone || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.proof_url) {
      toast.error('Please upload proof of ownership');
      return;
    }

    try {
      setIsSubmitting(true);
      
      await venueWorkflowService.createClaimRequest({
        venue_id: venue.id,
        contact_name: formData.contact_name,
        phone: formData.phone,
        email: formData.email,
        proof_url: formData.proof_url,
        message: formData.message
      });

      toast.success('Claim request submitted successfully! We will review and contact you soon.');
      onSuccess?.();
      onClose();
      
    } catch (error) {
      console.error('Error submitting claim:', error);
      toast.error('Failed to submit claim request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Claim This Venue</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="mb-4 p-3 bg-green-50 rounded-lg">
            <h3 className="font-medium text-green-900">{venue.name}</h3>
            <p className="text-sm text-green-700">{venue.district}, {venue.province}</p>
            <p className="text-xs text-green-600 mt-1">
              Prove ownership to claim this venue and start managing bookings.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Contact Name *
              </label>
              <Input
                type="text"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                placeholder="Your full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="h-4 w-4 inline mr-1" />
                Phone Number *
              </label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+977-1-4444444"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="h-4 w-4 inline mr-1" />
                Email Address *
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="h-4 w-4 inline mr-1" />
                Proof of Ownership *
              </label>
              <div className="space-y-2">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {uploadingProof ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span className="text-sm text-gray-500">Uploading...</span>
                        </div>
                      ) : formData.proof_url ? (
                        <div className="text-center">
                          <FileText className="h-8 w-8 text-green-500 mb-2" />
                          <p className="text-sm text-green-600">Proof uploaded successfully</p>
                          <p className="text-xs text-gray-500">Click to change</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">
                            <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">PDF, JPG, PNG up to 5MB</p>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleProofUpload}
                      disabled={uploadingProof}
                    />
                  </label>
                </div>
                {formData.proof_url && (
                  <div className="text-xs text-gray-500">
                    <p>✓ Proof document uploaded</p>
                    <p>Accepted formats: PDF, JPG, PNG (max 5MB)</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageSquare className="h-4 w-4 inline mr-1" />
                Additional Message
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tell us about your venue, any special features, or why you should own this listing..."
              />
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isSubmitting || !formData.proof_url}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Submitting...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Submit Claim Request
                  </div>
                )}
              </Button>
            </div>
          </form>

          <div className="mt-4 text-xs text-gray-500 text-center">
            <p>We will review your proof and contact you within 24-48 hours.</p>
            <p>Once verified, you'll be able to manage this venue and enable bookings.</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};


