import React, { useState, useEffect, useRef } from 'react';
import { Mic, Loader2, Brain } from 'lucide-react';
import { transcribeWithWhisper } from '../utils/whisper';

export type MicButtonState = 'idle' | 'recording' | 'transcribing' | 'processing';

export interface MicButtonProps {
  onTranscript?: (transcript: string) => void;
  className?: string;
}

export function MicButton({ onTranscript, className = '' }: MicButtonProps) {
  const [state, setState] = useState<MicButtonState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const lastTapRef = useRef<number>(0);
  
  // Check microphone support on mount
  useEffect(() => {
    const checkSupport = (): void => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setIsSupported(false);
        setError('Microphone not supported. Please use HTTPS or a modern browser.');
        return;
      }
      
      // Additional check for secure context
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        setIsSupported(false);
        setError('Microphone requires HTTPS. Please use a secure connection.');
        return;
      }
      
      setIsSupported(true);
      setError(null);
    };
    
    checkSupport();
  }, []);

  // Start recording
  const startRecording = async (): Promise<void> => {
    try {
      console.log('Starting recording...');
      setError(null);
      chunksRef.current = [];

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access not available. Please use HTTPS or a supported browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });