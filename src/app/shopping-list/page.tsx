'use client';

import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import type { ShoppingListItem } from '@/types';
import { Trash2, ShoppingCart } from 'lucide-react';

export default function ShoppingListPage() {
  const [shoppingList, setShoppingList] = useLocalStorage<ShoppingListItem[]>('shoppingList', []);

  const handleToggleItem = (id: string) => {
    setShoppingList(
      shoppingList.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleClearList = () => {
    setShoppingList([]);
  };
  
  const checkedItems = shoppingList.filter(item => item.checked);
  const uncheckedItems = shoppingList.filter(item => !item.checked);

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
              {checkedItems.length} de {shoppingList.length} artículos comprados.
            </CardDescription>
          </div>
          {shoppingList.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleClearList}>
              <Trash2 className="mr-2 h-4 w-4" /> Limpiar Lista
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {shoppingList.length > 0 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                {uncheckedItems.map(item => (
                  <div key={item.id} className="flex items-center space-x-3 bg-background p-3 rounded-md">
                    <Checkbox
                      id={item.id}
                      checked={item.checked}
                      onCheckedChange={() => handleToggleItem(item.id)}
                    />
                    <label
                      htmlFor={item.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {item.name}
                    </label>
                  </div>
                ))}
              </div>
              
              {checkedItems.length > 0 && uncheckedItems.length > 0 && <Separator />}

              {checkedItems.length > 0 && (
                <div className="space-y-2">
                   <h3 className="text-sm font-medium text-muted-foreground px-3 pt-2">Comprados</h3>
                  {checkedItems.map(item => (
                    <div key={item.id} className="flex items-center space-x-3 bg-muted/50 p-3 rounded-md">
                      <Checkbox
                        id={item.id}
                        checked={item.checked}
                        onCheckedChange={() => handleToggleItem(item.id)}
                      />
                      <label
                        htmlFor={item.id}
                        className="text-sm font-medium leading-none text-muted-foreground line-through peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {item.name}
                      </label>
                    </div>
                  ))}
                </div>
              )}
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
