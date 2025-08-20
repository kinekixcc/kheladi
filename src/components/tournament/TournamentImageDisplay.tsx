import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Eye, Download, Share2, Heart } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface TournamentImageDisplayProps {
  images: string[];
  tournamentName: string;
  className?: string;
  showControls?: boolean;
}

export const TournamentImageDisplay: React.FC<TournamentImageDisplayProps> = ({
  images,
  tournamentName,
  className = '',
  showControls = true
}) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [imageLoading, setImageLoading] = useState<{ [key: number]: boolean }>({});

  // Only use organizer-uploaded images, no fallbacks
  const displayImages = images.filter(img => img && img.trim() !== '');
  
  // If no valid images, show placeholder
  if (displayImages.length === 0) {
    return (
      <div className={`bg-gradient-to-br from-blue-100 to-indigo-200 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center p-8">
          <ImageIcon className="h-16 w-16 text-blue-400 mx-auto mb-4" />
          <p className="text-blue-700 font-medium">No tournament banner uploaded</p>
          <p className="text-blue-600 text-sm">Organizer can add images to showcase this tournament</p>
        </div>
      </div>
    );
  }

  const handleImageLoad = (index: number) => {
    setImageLoading(prev => ({ ...prev, [index]: false }));
  };

  const handleImageError = (index: number) => {
    setImageLoading(prev => ({ ...prev, [index]: false }));
    // Could implement fallback to default image here
  };

  const openLightbox = (index: number) => {
    setSelectedImage(index);
    setIsLightboxOpen(true);
  };

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % displayImages.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  const downloadImage = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${tournamentName.replace(/[^a-zA-Z0-9]/g, '_')}_image.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const shareImage = async (imageUrl: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${tournamentName} - Tournament Image`,
          url: imageUrl,
        });
      } catch (error) {
        navigator.clipboard.writeText(imageUrl);
      }
    } else {
      navigator.clipboard.writeText(imageUrl);
    }
  };

  return (
    <div className={className}>
      {/* Main Image Display */}
      <div className="relative">
        <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
          {imageLoading[selectedImage] && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          <img
            src={displayImages[selectedImage]}
            alt={`${tournamentName} - Image ${selectedImage + 1}`}
            className="w-full h-full object-cover cursor-pointer transition-transform hover:scale-105"
            onClick={() => openLightbox(selectedImage)}
            onLoad={() => handleImageLoad(selectedImage)}
            onError={() => handleImageError(selectedImage)}
            loading="lazy"
          />
          
          {/* Image Counter */}
          {displayImages.length > 1 && (
            <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs">
              {selectedImage + 1} / {displayImages.length}
            </div>
          )}
          
          {/* Navigation Arrows */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
              >
                ←
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
              >
                →
              </button>
            </>
          )}
        </div>

        {/* Image Controls */}
        {showControls && (
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                className="bg-white bg-opacity-90 hover:bg-opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  openLightbox(selectedImage);
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-white bg-opacity-90 hover:bg-opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  downloadImage(displayImages[selectedImage]);
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                className="bg-white bg-opacity-90 hover:bg-opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  shareImage(displayImages[selectedImage]);
                }}
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-white bg-opacity-90 hover:bg-opacity-100"
              >
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {displayImages.length > 1 && (
        <div className="flex space-x-2 mt-4 overflow-x-auto pb-2">
          {displayImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                selectedImage === index ? 'border-blue-500' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-full p-4">
            <img
              src={displayImages[selectedImage]}
              alt={`${tournamentName} - Full Size`}
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Close Button */}
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
            >
              ×
            </button>
            
            {/* Navigation in Lightbox */}
            {displayImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70"
                >
                  ←
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70"
                >
                  →
                </button>
              </>
            )}
            
            {/* Image Info */}
            <div className="absolute bottom-4 left-4 right-4 text-center">
              <p className="text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full inline-block">
                {tournamentName} - Image {selectedImage + 1} of {displayImages.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};