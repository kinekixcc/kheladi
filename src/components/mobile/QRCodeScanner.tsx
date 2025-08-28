import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, X, Camera, Flashlight, FlashlightOff, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';

interface QRCodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

export const QRCodeScanner: React.FC<QRCodeScannerProps> = ({
  isOpen,
  onClose,
  onScan
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanningText, setScanningText] = useState('Position QR code in frame');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (isOpen) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isOpen]);

  const startScanner = async () => {
    try {
      setError(null);
      setIsScanning(true);
      setScanningText('Starting camera...');

      // Check if device has camera
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not available on this device');
      }

      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setScanningText('Position QR code in frame');
      }

      // Check for flash support
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      setHasFlash(!!capabilities.torch);

      // Start QR code detection
      startQRDetection();

    } catch (err) {
      console.error('Camera error:', err);
      setError(err instanceof Error ? err.message : 'Failed to access camera');
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
    setError(null);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const startQRDetection = () => {
    // Simple QR code detection simulation
    // In production, you'd use a library like jsQR, ZXing, or QuaggaJS
    const detectQR = () => {
      if (!videoRef.current || !canvasRef.current) return;
      
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;
      
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      
      // Simulate QR code detection with random chance
      if (Math.random() < 0.01) { // 1% chance per frame
        const mockQRData = `tournament:${Math.random().toString(36).substr(2, 9)}`;
        onScan(mockQRData);
        stopScanner();
        onClose();
        return;
      }
      
      // Continue scanning
      animationRef.current = requestAnimationFrame(detectQR);
    };

    animationRef.current = requestAnimationFrame(detectQR);
  };

  const toggleFlash = async () => {
    if (!streamRef.current || !hasFlash) return;
    
    try {
      const track = streamRef.current.getVideoTracks()[0];
      if (track.getCapabilities().torch) {
        await track.applyConstraints({
          advanced: [{ torch: !isFlashOn }]
        });
        setIsFlashOn(!isFlashOn);
      }
    } catch (error) {
      console.error('Flash toggle error:', error);
    }
  };

  const handleRetry = () => {
    setError(null);
    startScanner();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4"
      >
        <div className="relative w-full h-full max-w-md max-h-[80vh] mx-auto">
          {/* Camera View */}
          <div className="relative bg-black rounded-xl overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            
            {/* Scanning Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-blue-500 rounded-lg relative">
                {/* Corner Indicators */}
                <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-blue-500"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-blue-500"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-blue-500"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-blue-500"></div>
                
                {/* Scanning Line */}
                <motion.div
                  animate={{ y: [0, 256, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute left-0 w-full h-0.5 bg-blue-500"
                />
              </div>
            </div>

            {/* Flash Toggle */}
            {hasFlash && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleFlash}
                className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 rounded-full backdrop-blur-sm"
              >
                {isFlashOn ? (
                  <FlashlightOff className="w-5 h-5 text-white" />
                ) : (
                  <Flashlight className="w-5 h-5 text-white" />
                )}
              </motion.button>
            )}

            {/* Hidden canvas for QR detection */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Instructions */}
          <div className="mt-4 text-center text-white">
            <p className="text-sm font-medium">{scanningText}</p>
            <p className="text-xs text-gray-300 mt-1">The scanner will automatically detect QR codes</p>
          </div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-red-500 text-white rounded-lg text-center"
            >
              <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm mb-3">{error}</p>
              <Button
                onClick={handleRetry}
                variant="outline"
                size="sm"
                className="text-white border-white hover:bg-white hover:text-red-500"
              >
                Try Again
              </Button>
            </motion.div>
          )}

          {/* Close Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="absolute top-4 left-4 p-2 bg-black bg-opacity-50 rounded-full backdrop-blur-sm"
          >
            <X className="w-5 h-5 text-white" />
          </motion.button>

          {/* Manual QR Input */}
          <div className="mt-4 text-center">
            <Button
              onClick={() => {
                const manualCode = prompt('Enter QR code manually:');
                if (manualCode) {
                  onScan(manualCode);
                  onClose();
                }
              }}
              variant="outline"
              className="text-white border-white hover:bg-white hover:text-black"
            >
              <QrCode className="w-4 h-4 mr-2" />
              Enter Manually
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};







