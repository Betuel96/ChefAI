// src/components/shopping-list/shopping-list-view.tsx
'use client';

import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import type { ShoppingListCategory } from '@/types';
import { Trash2, ShoppingCart, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Locale } from '@/i18n.config';

export function ShoppingListView() {
  const [shoppingList, setShoppingList] = useLocalStorage<ShoppingListCategory[]>('shoppingList', []);
  const params = useParams();
  const locale = params.locale as Locale;

  // Filtra cualquier categoría o artículo no válido para evitar errores de ejecución
  const validShoppingList = (Array.isArray(shoppingList) ? shoppingList : [])
    .filter(category => category && Array.isArray(category.items));

  const handleToggleItem = (id: string) => {
    const updatedList = validShoppingList.map(category => ({
      ...category,
      items: category.items.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      ),
    }));
    setShoppingList(updatedList);
  };

  const handleClearList = () => {
    setShoppingList([]);
  };

  const totalItems = validShoppingList.reduce((acc, category) => acc + category.items.length, 0);
  const checkedItemsCount = validShoppingList.reduce(
    (acc, category) => acc + category.items.filter(item => item.checked).length,
    0
  );

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-headline flex items-center gap-2"><ShoppingCart /> Tu Lista de Compras</CardTitle>
          {totalItems > 0 && 
              <CardDescription>
              {checkedItemsCount} de {totalItems} artículos comprados.
              </CardDescription>
          }
        </div>
        {validShoppingList.length > 0 && (
          <Button variant="destructive" size="sm" onClick={handleClearList}>
            <Trash2 className="mr-2 h-4 w-4" /> Limpiar Lista
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {validShoppingList.length > 0 ? (
          <div className="space-y-6">
            {validShoppingList.map(category => (
              <div key={category.category}>
                <h3 className="font-headline text-xl font-semibold text-accent mb-3 border-b pb-2">
                  {category.category}
                </h3>
                <div className="space-y-2">
                  {category.items.map(item => (
                    <div key={item.id} className="flex items-center space-x-3 bg-background p-3 rounded-md transition-colors hover:bg-muted/50">
                      <Checkbox
                        id={item.id}
                        checked={item.checked}
                        onCheckedChange={() => handleToggleItem(item.id)}
                      />
                      <label
                        htmlFor={item.id}
                        className={cn(
                          "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                          item.checked && "line-through text-muted-foreground"
                        )}
                      >
                        {item.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
           <div className="text-center text-muted-foreground py-10 flex flex-col items-center">
            <ShoppingCart className="w-16 h-16 mb-4" />
            <h3 className="font-headline text-2xl font-semibold mb-2 text-foreground">Tu Lista de Compras está Vacía</h3>
            <p className="mb-6 max-w-sm">
              Genera un plan de comidas y luego crea una lista de compras para que aparezca aquí.
            </p>
            <Button asChild>
              <Link href={`/${locale}/planner`}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Ir al Planificador
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
