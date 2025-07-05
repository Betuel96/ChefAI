// src/components/cooking/cooking-assistant.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import type { Recipe } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Mic, ChefHat } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserCircle } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { getCookingResponse, CookingAssistantInput } from '@/ai/flows/cooking-assistant-flow';
import { generateSpokenInstructions } from '@/ai/flows/text-to-speech';

interface CookingAssistantProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  recipe: Recipe;
}

interface Message {
  role: 'user' | 'model';
  content: string;
}

export function CookingAssistant({ isOpen, onOpenChange, recipe }: CookingAssistantProps) {
  const [conversation, setConversation] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isGreetingRef = useRef(false);

  // This function is called when the speech recognition hook gets a final result.
  const handleSpeechResult = async (userQuery: string) => {
    if (!userQuery.trim()) return;

    // Immediately update the conversation with the user's query
    const updatedConversation = [...conversation, { role: 'user' as const, content: userQuery }];
    setConversation(updatedConversation);
    setIsProcessing(true);

    try {
      const input: CookingAssistantInput = {
        recipe,
        history: updatedConversation, // Pass the fresh conversation history
        userQuery,
      };

      // 1. Get the text response first for faster UI update
      const responseText = await getCookingResponse(input);
      setConversation(prev => [...prev, { role: 'model', content: responseText }]);

      // 2. Now generate the audio for the response we just received
      const audioResult = await generateSpokenInstructions(responseText);
      setAudioUrl(audioResult.audioDataUri);

    } catch (error) {
      console.error("Error with cooking assistant:", error);
      const errorMessage = "Lo siento, he tenido un problema. ¿Podrías repetirlo?";
      setConversation(prev => [...prev, { role: 'model', content: errorMessage }]);
      // Optionally generate TTS for the error message
      try {
        const errorAudio = await generateSpokenInstructions(errorMessage);
        setAudioUrl(errorAudio.audioDataUri);
      } catch (ttsError) {
        console.error("Failed to generate TTS for error message:", ttsError);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const { isListening, startListening, hasRecognitionSupport } = useSpeechRecognition({
    onResult: handleSpeechResult,
  });

  // Effect to play audio when a new audioUrl is set
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
    }
  }, [audioUrl]);

  // Effect to auto-scroll the conversation view
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [conversation]);

  // Effect to greet the user when the dialog opens for the first time
  useEffect(() => {
    if (isOpen && conversation.length === 0 && !isGreetingRef.current) {
      isGreetingRef.current = true; // Prevents re-greeting on re-renders
      const initialGreeting = `¡Hola! Soy ChefAI, tu asistente de cocina. Estoy aquí para ayudarte con la receta de "${recipe.name}". Puedes pedirme los ingredientes, el siguiente paso, o preguntarme por sustituciones. Simplemente pulsa el micrófono para hablar. ¿Estás listo para empezar?`;
      
      const greet = async () => {
        setIsProcessing(true);
        try {
          const { audioDataUri } = await generateSpokenInstructions(initialGreeting);
          setConversation([{ role: 'model', content: initialGreeting }]);
          setAudioUrl(audioDataUri);
        } catch (e) {
          console.error("Failed to generate greeting:", e);
          setConversation([{ role: 'model', content: "Hola, ¿listo para cocinar?" }]);
        } finally {
          setIsProcessing(false);
        }
      };
      greet();
    }
    
    // Reset on close
    if (!isOpen) {
        setConversation([]);
        isGreetingRef.current = false;
    }
  }, [isOpen, recipe.name, conversation.length]);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <ChefHat className="text-primary" /> Asistente de Cocina
          </DialogTitle>
          <DialogDescription>{recipe.name}</DialogDescription>
        </DialogHeader>
        <div className="py-6 space-y-4">
          <ScrollArea className="h-64 w-full rounded-md border p-4" ref={scrollAreaRef}>
             <div className="flex flex-col gap-4">
                {conversation.map((msg, index) => (
                  <div key={index} className={cn('flex items-start gap-3', msg.role === 'user' && 'justify-end')}>
                    {msg.role === 'model' && (
                        <Avatar className="w-8 h-8 flex-shrink-0">
                           <AvatarFallback className="bg-primary text-primary-foreground"><ChefHat className="w-5 h-5"/></AvatarFallback>
                        </Avatar>
                    )}
                    <div className={cn(
                        'p-3 rounded-lg max-w-xs', 
                        msg.role === 'model' ? 'bg-muted' : 'bg-primary text-primary-foreground'
                    )}>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                     {msg.role === 'user' && (
                        <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarFallback><UserCircle /></AvatarFallback>
                        </Avatar>
                     )}
                  </div>
                ))}
             </div>
          </ScrollArea>

          <div className="flex flex-col justify-center items-center gap-2">
            <Button 
              size="lg" 
              className={cn(
                "rounded-full w-20 h-20 transition-all duration-300",
                isListening && 'bg-destructive hover:bg-destructive/90 scale-110'
              )}
              onClick={startListening}
              disabled={!hasRecognitionSupport || isListening || isProcessing}
            >
              {isProcessing ? <Loader2 className="h-8 w-8 animate-spin" /> : <Mic className="h-8 w-8" />}
            </Button>
            {!hasRecognitionSupport && (
                <p className="text-xs text-destructive text-center">El reconocimiento de voz no es compatible con este navegador.</p>
            )}
             {isListening && (
                <p className="text-sm text-muted-foreground animate-pulse">Escuchando...</p>
             )}
          </div>
        </div>
        <audio ref={audioRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}
