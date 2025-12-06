import React, { useRef, useEffect, useState } from 'react';
import BigButton from './BigButton';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } // Prefer back camera
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setError("Unable to access camera. Please allow permission.");
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleTakeConfig = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(imageData);
      }
    }
  };

  if (error) {
    return (
      <div className="flex flex-col h-full justify-center p-6 space-y-6">
        <div className="text-center text-red-400 text-xl font-bold">{error}</div>
        <BigButton label="Go Back" onClick={onCancel} variant="secondary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black relative">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        className="flex-1 object-cover w-full h-full"
        aria-label="Camera preview"
      />
      
      <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/80 to-transparent space-y-4">
        <BigButton 
          label="Capture Photo" 
          onClick={handleTakeConfig} 
          icon={<span>📸</span>}
          className="border-white/20"
        />
        <BigButton 
          label="Cancel" 
          onClick={onCancel} 
          variant="secondary"
          className="h-16 py-0 opacity-80"
        />
      </div>
    </div>
  );
};

export default CameraCapture;
