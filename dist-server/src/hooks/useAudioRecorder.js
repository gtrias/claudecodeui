import { useState, useRef, useCallback } from 'react';
export function useAudioRecorder() {
    const [isRecording, setRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [error, setError] = useState(null);
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const chunksRef = useRef([]);
    const start = useCallback(async () => {
        try {
            setError(null);
            setAudioBlob(null);
            chunksRef.current = [];
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000,
                }
            });
            streamRef.current = stream;
            // Determine supported MIME type
            const mimeType = MediaRecorder.isTypeSupported('audio/webm')
                ? 'audio/webm'
                : 'audio/mp4';
            // Create media recorder
            const recorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = recorder;
            // Set up event handlers
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };
            recorder.onstop = () => {
                // Create blob from chunks
                const blob = new Blob(chunksRef.current, { type: mimeType });
                setAudioBlob(blob);
                // Clean up stream
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                }
            };
            recorder.onerror = (event) => {
                console.error('MediaRecorder error:', event);
                setError('Recording failed');
                setRecording(false);
            };
            // Start recording
            recorder.start();
            setRecording(true);
        }
        catch (err) {
            console.error('Error starting recording:', err);
            setError(err instanceof Error ? err.message : 'Failed to start recording');
        }
    }, []);
    const stop = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setRecording(false);
        }
    }, [isRecording]);
    const pause = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.pause();
        }
    }, []);
    const resume = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.resume();
        }
    }, []);
    return {
        state: { isRecording, audioBlob, error },
        start,
        stop,
        pause,
        resume,
    };
}
export default useAudioRecorder;
