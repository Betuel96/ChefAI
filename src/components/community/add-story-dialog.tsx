// src/components/community/add-story-dialog.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { createStory } from '@/lib/community';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { PostMedia } from '@/components/community/post-media';
import { Upload } from 'lucide-react';

interface AddStoryDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onStoryAdded: () => void;
}

export function AddStoryDialog({ isOpen, onOpenChange, onStoryAdded }: AddStoryDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isPublishing, setIsPublishing] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);

  const handleMediaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: 'Archivo demasiado grande',
          description: 'Por favor, selecciona un archivo de menos de 10MB.',
          variant: 'destructive',
        });
        return;
      }

      setMediaFile(file);
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      setMediaType(type);

      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublish = async () => {
    if (!user || !mediaFile || !mediaPreview || !mediaType) return;

    setIsPublishing(true);
    try {
      await createStory(user.uid, mediaPreview, mediaType);
      toast({
        title: '¡Historia Publicada!',
        description: 'Tu historia es ahora visible para tus seguidores.',
      });
      onStoryAdded();
      handleClose();
    } catch (error: any) {
      toast({
        title: 'Error al Publicar',
        description: error.message || 'No se pudo subir tu historia. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleClose = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Añadir a tu Historia</DialogTitle>
          <DialogDescription>
            Sube una imagen o video. Estará visible durante 24 horas.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {mediaPreview && mediaType ? (
            <div className="aspect-video w-full relative rounded-md overflow-hidden bg-muted">
              <PostMedia mediaUrl={mediaPreview} mediaType={mediaType} altText="Vista previa de la historia" className="object-contain" />
            </div>
          ) : (
             <div className="aspect-video w-full flex flex-col items-center justify-center bg-muted rounded-md text-muted-foreground">
                <Upload className="w-10 h-10 mb-2"/>
                <p>Sube una imagen o video</p>
            </div>
          )}
          <Input 
            type="file" 
            accept="image/png, image/jpeg, video/mp4, video/webm" 
            onChange={handleMediaChange}
            disabled={isPublishing}
          />
        </div>
        <Button onClick={handlePublish} disabled={!mediaFile || isPublishing} className="w-full">
          {isPublishing ? 'Publicando...' : 'Publicar Historia'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
