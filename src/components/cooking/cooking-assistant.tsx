// src/components/cooking/cooking-assistant.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import type { Recipe } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Mic, ChefHat, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { generateSpokenInstructions } from '@/ai/flows/text-to-speech';
import { Progress } from '../ui/progress';

interface CookingAssistantProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  recipe: Recipe;
}

export function CookingAssistant({ isOpen, onOpenChange, recipe }: CookingAssistantProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const instructions = recipe.instructions;
  const currentInstruction = instructions[currentStepIndex];

  const speakInstruction = async (instructionText: string) => {
    setIsSpeaking(true);
    setAudioUrl(null);
    try {
      const { audioDataUri } = await generateSpokenInstructions(instructionText);
      setAudioUrl(audioDataUri);
    } catch (error) {
      console.error("Error generating speech:", error);
    } finally {
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentInstruction) {
      speakInstruction(currentInstruction);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentStepIndex]);
  
  useEffect(() => {
    if (audioUrl && audioRef.current) {
        audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
    }
  }, [audioUrl]);

  const handleNext = () => {
    if (currentStepIndex < instructions.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onOpenChange(false); // Close when finished
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };
  
  const handleRepeat = () => {
      if (currentInstruction) {
        speakInstruction(currentInstruction);
      }
  };

  const progress = ((currentStepIndex + 1) / instructions.length) * 100;
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <ChefHat className="text-primary" /> Asistente de Cocina
          </DialogTitle>
          <DialogDescription>{recipe.name}</DialogDescription>
        </DialogHeader>
        <div className="py-6 space-y-6 text-center">
            <div className="h-40 flex items-center justify-center p-4 bg-muted rounded-lg">
                <p className="text-lg font-semibold">{currentInstruction || "¡Todo listo!"}</p>
            </div>
            <div className="space-y-2">
                 <Progress value={progress} />
                 <p className="text-sm text-muted-foreground">Paso {currentStepIndex + 1} de {instructions.length}</p>
            </div>
             <div className="flex justify-center items-center gap-4 pt-4">
                <Button variant="outline" size="icon" onClick={handlePrev} disabled={currentStepIndex === 0 || isSpeaking}>
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button size="lg" onClick={handleRepeat} disabled={isSpeaking}>
                    {isSpeaking ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                    ): (
                        <RotateCcw className="h-6 w-6" />
                    )}
                </Button>
                <Button variant="outline" size="icon" onClick={handleNext} disabled={isSpeaking}>
                    <ChevronRight className="h-5 w-5" />
                </Button>
            </div>
        </div>
        {audioUrl && <audio ref={audioRef} src={audioUrl} />}
      </DialogContent>
    </Dialog>
  );
}
