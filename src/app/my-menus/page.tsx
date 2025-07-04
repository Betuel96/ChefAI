
'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { SavedWeeklyPlan, DailyMealPlan } from '@/types';
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
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MenuSquare, Trash2, LogIn, CalendarDays, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { getMenus, deleteMenu, publishMenuAsPost } from '@/lib/menus';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const MealCard = ({ meal }: { meal: DailyMealPlan['breakfast'] }) => (
  <Card className="mt-4 border-accent/20">
    <CardHeader>
      <CardTitle className="font-headline text-xl">{meal.name}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <h5 className="font-headline font-semibold text-accent">Ingredientes</h5>
        <ul className="list-disc list-inside mt-2 text-muted-foreground">
          {meal.ingredients
            .split('\n')
            .filter((ing) => ing.trim() !== '')
            .map((ing, i) => (
              <li key={i}>{ing}</li>
            ))}
        </ul>
      </div>
      <div>
        <h5 className="font-headline font-semibold text-accent">Instrucciones</h5>
        <p className="whitespace-pre-wrap mt-2 text-muted-foreground">{meal.instructions}</p>
      </div>
    </CardContent>
  </Card>
);

export default function MyMenusPage() {
  const { user, loading: authLoading } = useAuth();
  const [savedMenus, setSavedMenus] = useState<SavedWeeklyPlan[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<SavedWeeklyPlan | null>(null);
  const [caption, setCaption] = useState('');

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (user) {
      setPageLoading(true);
      getMenus(user.uid)
        .then(setSavedMenus)
        .catch(() => {
          toast({
            title: 'Error al Cargar Menús',
            description: 'No se pudieron obtener tus menús guardados. Inténtalo de nuevo.',
            variant: 'destructive',
          });
        })
        .finally(() => setPageLoading(false));
    } else {
      setSavedMenus([]);
      setPageLoading(false);
    }
  }, [user, authLoading, toast]);
  
  const handlePublishClick = (menu: SavedWeeklyPlan) => {
    setSelectedMenu(menu);
    setCaption(`¡Mira mi plan de comidas para ${menu.weeklyMealPlan.length} días! Hecho con ChefAI.`);
  };

  const handlePublishConfirm = async () => {
    if (!user || !selectedMenu) return;
    setIsPublishing(true);
    try {
      await publishMenuAsPost(user.uid, user.displayName || 'Anónimo', user.photoURL, caption, selectedMenu);
      toast({
        title: "¡Menú Publicado!",
        description: "Tu plan de comidas ahora está visible en la comunidad."
      });
      setSelectedMenu(null);
    } catch (error) {
      toast({
        title: "Error al Publicar",
        description: "No se pudo publicar tu menú.",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
    }
  }


  const handleDeleteMenu = async (menuIdToDelete: string) => {
    if (!user) return;
    
    const originalMenus = [...savedMenus];
    setSavedMenus(savedMenus.filter((menu) => menu.id !== menuIdToDelete));

    try {
      await deleteMenu(user.uid, menuIdToDelete);
      toast({
        title: 'Menú Eliminado',
        description: 'El plan de comidas ha sido eliminado de tu cuenta.',
      });
    } catch (error) {
      setSavedMenus(originalMenus);
      toast({
        title: 'Error al Eliminar',
        description: 'No se pudo eliminar el menú. Inténtalo de nuevo.',
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
            <h3 className="font-headline text-2xl font-semibold mb-2 text-foreground">Inicia Sesión para Ver tus Menús</h3>
            <p className="mb-6">Guarda tus planes de comidas y accede a ellos desde cualquier lugar.</p>
            <Button asChild>
                <Link href="/login">Acceder / Registrarse</Link>
            </Button>
        </div>
      );
    }

    if (savedMenus.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-10 flex flex-col items-center">
          <MenuSquare className="w-16 h-16 mb-4" />
          <h3 className="font-headline text-2xl font-semibold mb-2 text-foreground">No Tienes Menús Guardados</h3>
          <p className="mb-6 max-w-sm">
            Parece que aún no has creado ningún plan de comidas. ¡Empieza a planificar tu semana ahora!
          </p>
          <Button asChild>
            <Link href="/planner">
              <CalendarDays className="mr-2 h-4 w-4" />
              Ir al Planificador Semanal
            </Link>
          </Button>
        </div>
      );
    }

    return (
      <Accordion type="multiple" className="w-full space-y-2">
        {savedMenus.map((menu, index) => (
          <AccordionItem value={menu.id} key={menu.id} className="border-b-0">
            <Card>
              <AccordionTrigger className="p-4 font-headline text-lg hover:no-underline">
                Plan de Comida Guardado #{index + 1}
              </AccordionTrigger>
              <AccordionContent className="p-6 pt-0 space-y-4">
                {Array.isArray(menu.weeklyMealPlan) &&
                  menu.weeklyMealPlan.map((dailyPlan) => (
                    <div key={dailyPlan.day} className="py-2 border-b last:border-b-0">
                      <h4 className="font-headline font-bold text-accent text-lg mb-2">{dailyPlan.day}</h4>
                      <Tabs defaultValue="breakfast" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="breakfast">Desayuno</TabsTrigger>
                          <TabsTrigger value="lunch">Almuerzo</TabsTrigger>
                          <TabsTrigger value="comida">Comida</TabsTrigger>
                          <TabsTrigger value="dinner">Cena</TabsTrigger>
                        </TabsList>
                        <TabsContent value="breakfast">
                          {dailyPlan.breakfast && <MealCard meal={dailyPlan.breakfast} />}
                        </TabsContent>
                        <TabsContent value="lunch">
                          {dailyPlan.lunch && <MealCard meal={dailyPlan.lunch} />}
                        </TabsContent>
                        <TabsContent value="comida">
                          {dailyPlan.comida && <MealCard meal={dailyPlan.comida} />}
                        </TabsContent>
                        <TabsContent value="dinner">
                          {dailyPlan.dinner && <MealCard meal={dailyPlan.dinner} />}
                        </TabsContent>
                      </Tabs>
                    </div>
                  ))}
                <div className="flex flex-col sm:flex-row gap-2 mt-6 pt-6 border-t">
                  <Button variant="outline" size="sm" onClick={() => handlePublishClick(menu)}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Compartir en la Comunidad
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full sm:w-auto">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar Menú
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Esto eliminará permanentemente
                          este plan de comidas.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteMenu(menu.id)}>
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
    <div className="max-w-4xl mx-auto space-y-6">
      <header>
        <h1 className="font-headline text-4xl font-bold text-primary">Mis Menús Guardados</h1>
        <p className="text-muted-foreground mt-2 text-lg">Tu colección de planes de comidas semanales.</p>
      </header>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <MenuSquare /> Tus Planes de Comidas
          </CardTitle>
          {!authLoading && !pageLoading && user && <CardDescription>{savedMenus.length} menú(s) guardado(s) en tu cuenta.</CardDescription>}
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
      
      <AlertDialog open={!!selectedMenu} onOpenChange={(isOpen) => !isOpen && setSelectedMenu(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Compartir tu Plan de Comidas</AlertDialogTitle>
            <AlertDialogDescription>
              Añade un título o descripción para tu publicación. Será visible para otros en la comunidad.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="caption">Título/Descripción</Label>
              <Textarea id="caption" value={caption} onChange={(e) => setCaption(e.target.value)} />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublishConfirm} disabled={isPublishing}>
              {isPublishing ? 'Publicando...' : 'Publicar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
