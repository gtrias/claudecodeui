import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import { authenticatedFetch } from '../utils/api';

export interface File {
  projectName: string;
  path: string;
}

export interface ImageViewerProps {
  file?: File;
  onClose?: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  file,
  onClose
}) => {
  const imagePath = `/api/projects/${file?.projectName}/files/content?path=${encodeURIComponent(file?.path || '')}`;
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let objectUrl: string | undefined;
    const controller = new AbortController();

    const loadImage = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        setImageUrl(null);

        const response = await authenticatedFetch(imagePath, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        console.error('Error loading image:', err instanceof Error ? err.message : 'Unknown error');
        setError('Unable to load image');
      } finally {
        setLoading(false);
      }
    };

    loadImage();

    return () => {
      controller.abort();
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [imagePath]);