'use client';

import { useRouter } from 'next/navigation';
import type { SavedRecipe, NutritionalInfo } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookHeart, LogIn, Trash2, UtensilsCrossed, Sparkles, Beef, Share2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { getRecipes, deleteRecipe } from '@/lib/recipes';
import { publishRecipeAsPost } from '@/lib/community';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { PostMedia } from '@/components/community/post-media';

const NutritionalTable = ({ table }: { table: NutritionalInfo }) => (
  <div className="p-4 bg-muted/50 rounded-lg">
    <h3 className="font-headline text-lg font-semibold text-accent/80 flex items-center gap-2"><Beef className="w-5 h-5" /> Info. Nutricional (por porción)</h3>
    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
      <span>Calorías: {table.calories}</span>
      <span>Proteína: {table.protein}</span>
      <span>Carbohidratos: {table.carbs}</span>
      <span>Grasas: {table.fats}</span>
    </div>
  </div>
);


export function MyRecipesView() {
  const { user, loading: authLoading } = useAuth();
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  // State for publishing
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedRecipeToPublish, setSelectedRecipeToPublish] = useState<SavedRecipe | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (user) {
      setPageLoading(true);
      getRecipes(user.uid)
        .then(setSavedRecipes)
        .catch(() => {
          toast({
            title: 'Error al Cargar Recetas',
            description: 'No se pudieron obtener tus recetas guardadas. Inténtalo de nuevo.',
            variant: 'destructive',
          });
        })
        .finally(() => setPageLoading(false));
    } else {
      setSavedRecipes([]);
      setPageLoading(false);
    }
  }, [user, authLoading, toast]);

  const handlePublishConfirm = async () => {
    if (!user || !selectedRecipeToPublish) return;
    setIsPublishing(true);
    try {
      await publishRecipeAsPost(user.uid, user.displayName || 'Anónimo', user.photoURL, selectedRecipeToPublish);
      toast({
        title: "¡Receta Publicada!",
        description: `"${selectedRecipeToPublish.name}" ahora es visible para la comunidad.`
      });
      setSelectedRecipeToPublish(null);
      router.push('/community');
    } catch (error: any) {
      toast({
        title: "Error al Publicar",
        description: error.message || "No se pudo publicar tu receta.",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
    }
  };


  const handleDeleteRecipe = async (recipeId: string) => {
    if (!user) return;
    
    const originalRecipes = [...savedRecipes];
    const recipeToDelete = savedRecipes.find(r => r.id === recipeId);
    setSavedRecipes(savedRecipes.filter((recipe) => recipe.id !== recipeId));

    try {
      await deleteRecipe(user.uid, recipeId);
      toast({
        title: 'Receta Eliminada',
        description: `"${recipeToDelete?.name}" ha sido eliminada de tu cuenta.`,
      });
    } catch (error) {
      setSavedRecipes(originalRecipes);
      toast({
        title: 'Error al Eliminar',
        description: 'No se pudo eliminar la receta. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    }
  };

  const renderContent = () => {
    if (authLoading || pageLoading) {
      return (
         <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
         </div>
      );
    }

    if (!user) {
       return (
        <div className="text-center text-muted-foreground py-10 flex flex-col items-center">
            <LogIn className="w-16 h-16 mb-4" />
            <h3 className="font-headline text-2xl font-semibold mb-2 text-foreground">Inicia Sesión para Ver tus Recetas</h3>
            <p className="mb-6">Guarda tus creaciones y accede a ellas desde cualquier lugar.</p>
            <Button asChild>
                <Link href="/login">Acceder / Registrarse</Link>
            </Button>
        </div>
      );
    }

    if (savedRecipes.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-10 flex flex-col items-center">
            <BookHeart className="w-16 h-16 mb-4" />
            <h3 className="font-headline text-2xl font-semibold mb-2 text-foreground">Tu Libro de Recetas está Vacío</h3>
            <p className="mb-6 max-w-sm">
              ¿Listo para un poco de magia culinaria? ¡Ve al generador para crear tu primera receta!
            </p>
             <Button asChild>
              <Link href="/generator">
                <Sparkles className="mr-2 h-4 w-4" />
                Ir al Generador de Recetas
              </Link>
            </Button>
        </div>
      );
    }

    return (
       <Accordion type="multiple" className="w-full space-y-2">
        {savedRecipes.map((recipe) => (
            <AccordionItem value={recipe.id} key={recipe.id} className="border-b-0">
            <Card>
                <AccordionTrigger className="p-4 font-headline text-lg hover:no-underline">
                {recipe.name}
                </AccordionTrigger>
                <AccordionContent className="p-6 pt-0 space-y-6">
                
                {recipe.mediaUrl && recipe.mediaType ? (
                  <div className="my-4 rounded-lg overflow-hidden shadow-inner aspect-video relative">
                    <PostMedia
                        mediaUrl={recipe.mediaUrl}
                        mediaType={recipe.mediaType}
                        altText={`Media for ${recipe.name}`}
                        className="object-cover"
                        controls
                    />
                  </div>
                ) : (
                  <div className="my-4 rounded-lg flex flex-col items-center justify-center bg-muted aspect-video text-muted-foreground">
                    <UtensilsCrossed className="w-10 h-10 mb-2" />
                    <p>Sin imagen/video</p>
                  </div>
                )}
                
                {recipe.benefits && (
                    <div className="p-4 bg-primary/10 rounded-lg">
                        <h3 className="font-headline text-lg font-semibold text-primary/80 flex items-center gap-2"><Sparkles className="w-5 h-5" /> Beneficios</h3>
                        <p className="mt-2 text-primary/70 text-sm">{recipe.benefits}</p>
                    </div>
                )}
                {recipe.nutritionalTable && <NutritionalTable table={recipe.nutritionalTable} />}

                <div>
                    <h3 className="font-headline text-xl font-semibold text-accent">Ingredientes</h3>
                    <ul className="list-disc list-inside mt-2">
                        {recipe.ingredients.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </div>
                <Separator/>
                <div>
                    <h3 className="font-headline text-xl font-semibold text-accent">Instrucciones</h3>
                    <ol className="list-decimal list-inside mt-2">
                        {recipe.instructions.map((item, i) => <li key={i}>{item}</li>)}
                    </ol>
                </div>
                <Separator/>
                <div>
                    <h3 className="font-headline text-xl font-semibold text-accent">Equipo Necesario</h3>
                    <ul className="list-disc list-inside mt-2">
                        {recipe.equipment.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mt-6 pt-6 border-t">
                    <Button variant="outline" size="sm" onClick={() => setSelectedRecipeToPublish(recipe)}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Compartir en la Comunidad
                    </Button>
                    <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full sm:w-auto">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar Receta
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente la
                            receta "{recipe.name}" y su medio asociado.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteRecipe(recipe.id)}>
                            Continuar
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                    </AlertDialog>
                </div>
                </AccordionContent>
            </Card>
            </AccordionItem>
        ))}
        </Accordion>
    );
  };

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><BookHeart /> Tu Libro de Recetas</CardTitle>
          {!authLoading && !pageLoading && user && <CardDescription>{savedRecipes.length} receta(s) guardada(s) en tu cuenta.</CardDescription>}
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    
    <AlertDialog open={!!selectedRecipeToPublish} onOpenChange={(isOpen) => !isOpen && setSelectedRecipeToPublish(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Compartir tu Receta</AlertDialogTitle>
            <AlertDialogDescription>
              Esto publicará "{selectedRecipeToPublish?.name}" en el feed de la comunidad para que otros la vean. ¿Deseas continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublishConfirm} disabled={isPublishing}>
              {isPublishing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publicando...</> : 'Publicar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Default export for Next.js page compatibility
export default function MyRecipesPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
             <header>
                <h1 className="font-headline text-4xl font-bold text-primary">Mis Recetas Guardadas</h1>
                <p className="text-muted-foreground mt-2 text-lg">Todas tus recetas favoritas en un solo lugar.</p>
            </header>
            <MyRecipesView />
        </div>
    )
}
