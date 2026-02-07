import React, { useEffect, useState, useRef } from 'react';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import { authenticatedFetch } from '../utils/api';

export interface ImageFile {
  projectName: string;
  path: string;
}

export interface ImageViewerProps {
  file?: ImageFile;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ file, onClose }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadImage = async () => {
      if (!file) return;

      try {
        setLoading(true);
        setError(null);
        setImageUrl(null);

        const imagePath = `/api/projects/${file.projectName}/files/content?path=${encodeURIComponent(file.path)}`;
        const response = await authenticatedFetch(imagePath, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const blob = await response.blob();
        objectUrlRef.current = URL.createObjectURL(blob);
        setImageUrl(objectUrlRef.current);
      } catch (err) {
        if (err.name === 'AbortError') {
          return;
        }
        console.error('Error loading image:', err);
        setError('Unable to load image');
      } finally {
        setLoading(false);
      }
    };

    loadImage();

    return () => {
      controller.abort();
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, [file]);

  if (!file) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors z-10"
      >
        <X className="w-6 h-6" />
      </button>

      {loading && (
        <div className="text-white text-lg">Loading image...</div>
      )}

      {error && (
        <div className="text-white text-lg text-center">
          {error}
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      )}

      {imageUrl && (
        <img
          src={imageUrl}
          alt={file.path}
          className="max-w-full max-h-full object-contain"
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError('Failed to load image');
          }}
        />
      )}
    </div>
  );
};

export default ImageViewer;