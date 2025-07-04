// src/components/profile/EditProfileForm.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/lib/users';
import type { ProfileData, UserAccount } from '@/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Save, UserCircle, Image as ImageIcon } from 'lucide-react';

const profileFormSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres.').regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guiones bajos.'),
  image: z.instanceof(File).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface EditProfileFormProps {
    profile: ProfileData;
    onProfileUpdate: (newData: Partial<UserAccount>) => void;
}

export const EditProfileForm = ({ profile, onProfileUpdate }: EditProfileFormProps) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(profile.photoURL);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            name: profile.name || '',
            username: profile.username || '',
        },
    });

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            form.setValue('image', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = async (values: ProfileFormValues) => {
        if (!user) return;
        setIsSaving(true);
        try {
            const { updatedData } = await updateUserProfile(user.uid, values, values.image);
            
            toast({
                title: '¡Perfil Actualizado!',
                description: 'Tus cambios han sido guardados.',
            });
            onProfileUpdate(updatedData);

        } catch (error: any) {
             toast({
                title: 'Error al Actualizar',
                description: error.message || 'No se pudieron guardar tus cambios. Inténtalo de nuevo.',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Editar Perfil</CardTitle>
                <CardDescription>Actualiza tu información personal y foto de perfil.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={imagePreview || undefined} />
                                <AvatarFallback><UserCircle className="w-10 h-10" /></AvatarFallback>
                            </Avatar>
                            <FormField
                                control={form.control}
                                name="image"
                                render={() => (
                                    <FormItem className="flex-grow">
                                        <FormLabel>Foto de Perfil</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="file" 
                                                accept="image/png, image/jpeg" 
                                                onChange={handleImageChange}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre de Usuario</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" disabled={isSaving} className="w-full">
                            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                            <Save className="ml-2 h-4 w-4" />
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};
