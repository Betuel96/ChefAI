'use client';
import { useEffect, useState } from 'react';

// This is a simplified hook for the prototype. A production implementation would be more robust.

let recognition: any = null;
if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
  const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
  try {
    recognition = new SpeechRecognition();
    recognition.continuous = false; // We want to capture single commands/queries
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
  } catch (e) {
    console.error("Could not initialize SpeechRecognition:", e);
    recognition = null;
  }
}

interface UseSpeechRecognitionProps {
  onResult: (transcript: string) => void;
}

export const useSpeechRecognition = ({ onResult }: UseSpeechRecognitionProps) => {
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (!recognition) return;

    const handleResult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
      onResult(transcript);
      setIsListening(false);
    };

    const handleError = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    const handleEnd = () => {
      setIsListening(false);
    };

    recognition.addEventListener('result', handleResult);
    recognition.addEventListener('error', handleError);
    recognition.addEventListener('end', handleEnd);

    return () => {
      recognition.removeEventListener('result', handleResult);
      recognition.removeEventListener('error', handleError);
      recognition.removeEventListener('end', handleEnd);
      recognition.abort();
    };
  }, [onResult]);

  const startListening = () => {
    if (isListening || !recognition) return;
    try {
      setIsListening(true);
      recognition.start();
    } catch (e) {
      console.error("Error starting speech recognition:", e);
      setIsListening(false);
    }
  };

  return {
    isListening,
    startListening,
    hasRecognitionSupport: recognition !== null,
  };
};
