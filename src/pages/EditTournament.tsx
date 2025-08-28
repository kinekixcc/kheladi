import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, AlertTriangle, Eye, FileText } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { TournamentForm } from '../components/shared/TournamentForm';
import { useAuth } from '../context/AuthContext';
import { tournamentService } from '../lib/database';
import { auditLogService } from '../lib/auditLog';
import { imageUploadService } from '../lib/imageUpload';
import toast from 'react-hot-toast';

export const EditTournament: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tournament, setTournament] = useState<any>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    if (tournamentId) {
      loadTournament();
    }
  }, [tournamentId]);

  const loadTournament = async () => {
    try {
      const tournamentData = await tournamentService.getTournamentById(tournamentId!);
      
      // Check if user can edit this tournament
      if (tournamentData.organizer_id !== user?.id) {
        toast.error('You can only edit your own tournaments');
        navigate('/organizer-dashboard');
        return;
      }

      // Check if tournament can be edited
      if (!canEditTournament(tournamentData)) {
        toast.error('This tournament cannot be edited at this time');
        navigate('/organizer-dashboard');
        return;
      }

      setTournament(tournamentData);
    } catch (error) {
      console.error('Error loading tournament:', error);
      toast.error('Failed to load tournament');
      navigate('/organizer-dashboard');
    }
  };

  const canEditTournament = (tournament: any): boolean => {
    // Allow editing if:
    // 1. Tournament is pending approval (can modify before admin review)
    // 2. Tournament is rejected (can fix issues and resubmit)
    // 3. Tournament is draft (can modify before submission)
    // 4. Tournament is approved but not yet active (can modify before start)
    
    const editableStatuses = ['draft', 'pending_approval', 'rejected'];
    const currentDate = new Date();
    const startDate = new Date(tournament.start_date);
    
    return editableStatuses.includes(tournament.status) || 
           (tournament.status === 'approved' && startDate > currentDate);
  };

  const handleEdit = () => {
    setShowEditForm(true);
  };

  const handleSave = async (updatedData: any, files: { images: File[], pdf: File | null }) => {
    setLoading(true);
    try {
      let processedImageUrls: string[] = [];
      let processedPdfUrl: string | null = null;

      // Process file uploads if new files were selected
      if (files.images.length > 0) {
        console.log('📸 Starting image upload process...');
        console.log('📸 Number of images to upload:', files.images.length);
        console.log('📸 Image details:', files.images.map(f => ({ name: f.name, size: f.size, type: f.type })));
        
        try {
          console.log('🚀 Calling uploadMultipleImages with 30-second timeout...');
          
          // Add timeout to prevent hanging
          const uploadPromise = imageUploadService.uploadMultipleImages(files.images, 'venue-images');
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Image upload timed out after 30 seconds')), 30000)
          );
          
          const imageResults = await Promise.race([uploadPromise, timeoutPromise]) as any;
          console.log('📸 Upload results received:', imageResults);
          
          processedImageUrls = imageResults.filter(result => result.success).map(result => result.url);
          console.log('✅ Successfully processed image URLs:', processedImageUrls);
          console.log('❌ Failed uploads:', imageResults.filter(result => !result.success));
        } catch (uploadError) {
          console.error('❌ Image upload failed with error:', uploadError);
          throw new Error(`Image upload failed: ${uploadError.message || 'Unknown error'}`);
        }
      }

      if (files.pdf) {
        console.log('📄 Starting PDF upload process...');
        console.log('📄 PDF details:', { name: files.pdf.name, size: files.pdf.size, type: files.pdf.type });
        
        try {
          console.log('🚀 Calling uploadImage for PDF with 15-second timeout...');
          
          // Add timeout to prevent hanging
          const pdfUploadPromise = imageUploadService.uploadImage(files.pdf, 'payment-proofs');
          const pdfTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('PDF upload timed out after 15 seconds')), 15000)
          );
          
          const pdfResult = await Promise.race([pdfUploadPromise, pdfTimeoutPromise]) as any;
          console.log('📄 PDF upload result:', pdfResult);
          
          if (pdfResult.success) {
            processedPdfUrl = pdfResult.url;
            console.log('✅ New PDF uploaded successfully:', processedPdfUrl);
          } else {
            console.error('❌ PDF upload failed:', pdfResult.error);
          }
        } catch (pdfUploadError) {
          console.error('❌ PDF upload failed with error:', pdfUploadError);
          throw new Error(`PDF upload failed: ${pdfUploadError.message || 'Unknown error'}`);
        }
      }

      // Merge existing and new files
      const finalImageUrls: string[] = [
        ...(tournament.images || []).filter((img): img is string => Boolean(img)),
        ...processedImageUrls
      ];

      const finalPdfUrl: string | null = processedPdfUrl || tournament.pdf_document || null;

      // Prepare tournament data for update
      const tournamentData = {
        ...updatedData,
        images: finalImageUrls,
        pdf_document: finalPdfUrl,
        updated_at: new Date().toISOString()
      };

      // Update tournament
      const updatedTournament = await tournamentService.updateTournament(tournamentId!, tournamentData);
      
      // Log the edit action
      await auditLogService.logAction(
        user?.id || '',
        user?.full_name || 'Organizer',
        'EDIT_TOURNAMENT',
        'tournament',
        tournamentId!,
        tournament,
        updatedTournament
      );

      // If tournament was rejected, resubmit for approval
      if (tournament.status === 'rejected') {
        await tournamentService.updateTournament(tournamentId!, { 
          status: 'pending_approval',
          admin_notes: null // Clear rejection reason
        });
        
        toast.success('Tournament updated and resubmitted for approval!');
        
        // Log the resubmission
        await auditLogService.logAction(
          user?.id || '',
          user?.full_name || 'Organizer',
          'RESUBMIT_TOURNAMENT',
          'tournament',
          tournamentId!,
          { status: 'rejected' },
          { status: 'pending_approval' }
        );
      } else {
        toast.success('Tournament updated successfully!');
      }

      setTournament(updatedTournament);
      setShowEditForm(false);
      
      // Refresh tournament data
      loadTournament();
      
    } catch (error) {
      console.error('Error updating tournament:', error);
      toast.error('Failed to update tournament');
    } finally {
      setLoading(false);
    }
  };

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tournament...</p>
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
            onClick={() => navigate('/organizer-dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {tournament.status === 'rejected' ? 'Fix & Resubmit Tournament' : 'Edit Tournament'}
          </h1>
          <p className="text-gray-600">
            {tournament.status === 'rejected' 
              ? 'Fix the issues and resubmit for admin approval'
              : 'Modify tournament details'
            }
          </p>
        </motion.div>

        {/* Tournament Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{tournament.name}</h2>
                <p className="text-gray-600">
                  Status: <span className={`font-medium ${getStatusColor(tournament.status)}`}>
                    {tournament.status.replace('_', ' ')}
                  </span>
                </p>
                {tournament.admin_notes && (
                  <p className="text-sm text-red-600 mt-1">
                    <AlertTriangle className="h-3 w-3 inline mr-1" />
                    <strong>Admin Notes:</strong> {tournament.admin_notes}
                  </p>
                )}
              </div>
              
              {canEditTournament(tournament) && (
                <div className="flex gap-2">
                  {!showEditForm && (
                    <Button
                      onClick={handleEdit}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {tournament.status === 'rejected' ? 'Fix & Resubmit' : 'Edit Tournament'}
                    </Button>
                  )}
                  {showEditForm && (
                    <Button
                      onClick={() => setShowEditForm(false)}
                      variant="outline"
                      disabled={loading}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Edit Form */}
        {showEditForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <TournamentForm
              initialData={tournament}
              onSubmit={handleSave}
              isEditing={true}
              loading={loading}
            />
          </motion.div>
        )}

        {/* Tournament Details Preview */}
        {!showEditForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Tournament Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Basic Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {tournament.name}</div>
                    <div><span className="font-medium">Sport:</span> {tournament.sport_type}</div>
                    <div><span className="font-medium">Description:</span> {tournament.description}</div>
                    <div><span className="font-medium">Max Teams:</span> {tournament.max_teams || 'N/A'}</div>
                    <div><span className="font-medium">Entry Fee:</span> रू {tournament.entry_fee}</div>
                    <div><span className="font-medium">Prize Pool:</span> रू {tournament.prize_pool}</div>
                  </div>
                </div>

                {/* Schedule */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Schedule</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Start Date:</span> {tournament.start_date}</div>
                    <div><span className="font-medium">End Date:</span> {tournament.end_date}</div>
                    <div><span className="font-medium">Registration Deadline:</span> {tournament.registration_deadline}</div>
                  </div>
                </div>

                {/* Venue */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Venue</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Venue Name:</span> {tournament.venue_name}</div>
                    <div><span className="font-medium">Address:</span> {tournament.venue_address}</div>
                    <div><span className="font-medium">Province:</span> {tournament.province}</div>
                    <div><span className="font-medium">District:</span> {tournament.district}</div>
                  </div>
                </div>

                {/* Contact */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Contact</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Phone:</span> {tournament.contact_phone}</div>
                    <div><span className="font-medium">Email:</span> {tournament.contact_email}</div>
                  </div>
                </div>
              </div>

              {/* Rules & Requirements */}
              <div className="mt-6">
                <h4 className="font-medium text-gray-700 mb-3">Rules & Requirements</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="text-sm font-medium text-gray-600 mb-2">Tournament Rules</h5>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                      {tournament.rules}
                    </p>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-600 mb-2">Requirements</h5>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                      {tournament.requirements}
                    </p>
                  </div>
                </div>
              </div>

              {/* Files */}
              {tournament.images && tournament.images.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-700 mb-3">Tournament Images</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {tournament.images.map((image: string, index: number) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Tournament image ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}

              {tournament.pdf_document && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-700 mb-3">Tournament PDF</h4>
                  <a
                    href={tournament.pdf_document}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View PDF Document
                  </a>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending_approval': return 'text-yellow-600';
    case 'approved': return 'text-green-600';
    case 'rejected': return 'text-red-600';
    case 'active': return 'text-blue-600';
    case 'completed': return 'text-gray-600';
    default: return 'text-gray-600';
  }
};



