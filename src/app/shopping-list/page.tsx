'use client';

import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import type { ShoppingListCategory } from '@/types';
import { Trash2, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ShoppingListPage() {
  const [shoppingList, setShoppingList] = useLocalStorage<ShoppingListCategory[]>('shoppingList', []);

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
    <div className="max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="font-headline text-4xl font-bold text-primary">Lista de Compras</h1>
        <p className="text-muted-foreground mt-2 text-lg">Tu lista de compras generada. Marca los artículos a medida que los compras.</p>
      </header>
      
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline flex items-center gap-2"><ShoppingCart /> Tu Lista</CardTitle>
            <CardDescription>
              {checkedItemsCount} de {totalItems} artículos comprados.
            </CardDescription>
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
            <div className="text-center text-muted-foreground py-10">
              <p>Tu lista de compras está vacía.</p>
              <p>Genera una desde el Planificador Semanal o una receta guardada.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
