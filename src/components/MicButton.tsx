import React, { useState, useEffect, useRef } from 'react';
import { Mic, Loader2, Brain } from 'lucide-react';
import { transcribeWithWhisper } from '../utils/whisper';

export interface MicButtonProps {
  onTranscript?: (transcript: string) => void;
  className?: string;
}

type MicState = 'idle' | 'recording' | 'transcribing' | 'processing';

export function MicButton({ onTranscript, className = '' }: MicButtonProps) {
  const [state, setState] = useState<MicState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const lastTapRef = useRef<number>(0);
  
  // Check microphone support on mount
  useEffect(() => {
    const checkSupport = () => {
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
  const startRecording = async () => {
    try {
      console.log('Starting recording...');
      setError(null);
      chunksRef.current = [];

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access not available. Please use HTTPS or a supported browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        console.log('Recording stopped, creating blob...');
        const blob = new Blob(chunksRef.current, { type: mimeType });
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        // Start transcribing
        setState('transcribing');
        
        // Check if we're in an enhancement mode
        const whisperMode = window.localStorage.getItem('whisperMode') || 'default';
        const isEnhancementMode = whisperMode === 'prompt' || whisperMode === 'vibe' || whisperMode === 'instructions' || whisperMode === 'architect';
        
        // Set up a timer to switch to processing state for enhancement modes