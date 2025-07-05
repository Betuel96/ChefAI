'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookHeart, MenuSquare, ShoppingCart, Bookmark } from 'lucide-react';
import { MyRecipesView } from '@/app/my-recipes/page';
import { MyMenusView } from '@/app/my-menus/page';
import { ShoppingListView } from '@/app/shopping-list/page';
import { SavedPostsView } from '@/app/saved/page';

export default function LibraryPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <header>
        <h1 className="font-headline text-4xl font-bold text-primary">Mi Librería</h1>
        <p className="text-muted-foreground mt-2 text-lg">Todas tus recetas, menús y artículos guardados en un solo lugar.</p>
      </header>
      <Tabs defaultValue="recipes" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="recipes" className="py-2"><BookHeart className="mr-2 h-4 w-4" />Recetas</TabsTrigger>
          <TabsTrigger value="menus" className="py-2"><MenuSquare className="mr-2 h-4 w-4" />Menús</TabsTrigger>
          <TabsTrigger value="shopping-list" className="py-2"><ShoppingCart className="mr-2 h-4 w-4" />Lista</TabsTrigger>
          <TabsTrigger value="saved-posts" className="py-2"><Bookmark className="mr-2 h-4 w-4" />Guardado</TabsTrigger>
        </TabsList>
        <TabsContent value="recipes">
          <MyRecipesView />
        </TabsContent>
        <TabsContent value="menus">
          <MyMenusView />
        </TabsContent>
        <TabsContent value="shopping-list">
          <ShoppingListView />
        </TabsContent>
        <TabsContent value="saved-posts">
            <SavedPostsView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
