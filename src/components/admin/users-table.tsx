// src/components/admin/users-table.tsx
"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { MoreHorizontal, UserCircle, Edit, CheckCircle, Gem, Sparkles, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import type { UserAccount } from "@/types"
import { Badge } from "../ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { updateUserFromAdmin, deleteUserAndContent } from "@/lib/admin"

export function EditUserDialog({ user }: { user: UserAccount }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);
    const [selectedTier, setSelectedTier] = React.useState<string>(user.subscriptionTier || 'none');
    const [isVerified, setIsVerified] = React.useState<boolean>(user.isVerified || false);
    const [badges, setBadges] = React.useState<string>((user.badges || []).join(', '));
    const { toast } = useToast();

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const badgesArray = badges.split(',').map(b => b.trim()).filter(Boolean);
            await updateUserFromAdmin(user.id, {
                subscriptionTier: selectedTier === 'none' ? null : selectedTier,
                isVerified: isVerified,
                badges: badgesArray
            });
            toast({
                title: 'Usuario Actualizado',
                description: `El perfil de ${user.name} ha sido actualizado.`,
            });
            // TODO: Idealmente, la tabla debería actualizarse sin recargar la página.
            // Para este MVP, se requiere recargar.
            window.location.reload();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudo actualizar el usuario.',
                variant: 'destructive',
            })
        } finally {
            setIsSaving(false);
            setIsOpen(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <DialogTrigger asChild>
                    <div className="flex w-full items-center"><Edit className="mr-2 h-4 w-4" /> Editar Usuario</div>
                </DialogTrigger>
            </DropdownMenuItem>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar a {user.name}</DialogTitle>
                    <DialogDescription>
                        Modifica el nivel de suscripción y otros detalles del usuario.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="tier">Nivel de Suscripción</Label>
                        <Select value={selectedTier} onValueChange={setSelectedTier}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar nivel" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Ninguno</SelectItem>
                                <SelectItem value="pro">Pro</SelectItem>
                                <SelectItem value="voice+">Voice+</SelectItem>
                                <SelectItem value="lifetime">Lifetime</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Configuración Especial</Label>
                        <div className="flex items-center space-x-2 rounded-md border p-4">
                            <Switch id="verified-switch" checked={isVerified} onCheckedChange={setIsVerified} />
                            <Label htmlFor="verified-switch">Cuenta Verificada</Label>
                        </div>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="badges">Insignias Especiales</Label>
                        <Input
                            id="badges"
                            placeholder="ej: colaborador, beta-tester"
                            value={badges}
                            onChange={(e) => setBadges(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Separar por comas. Se mostrarán en el perfil del usuario.</p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function DeleteUserDialog({ user, onUserDeleted }: { user: UserAccount; onUserDeleted: (id: string) => void }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const { toast } = useToast();

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteUserAndContent(user.id);
            toast({
                title: 'Usuario Eliminado',
                description: `${user.name} y todo su contenido han sido eliminados.`,
            });
            onUserDeleted(user.id);
        } catch (error: any) {
            toast({
                title: 'Error de Eliminación',
                description: error.message || 'No se pudo eliminar al usuario y su contenido.',
                variant: 'destructive',
            });
        } finally {
            setIsDeleting(false);
            setIsOpen(false);
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
             <AlertDialogTrigger asChild>
                <button className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-destructive focus:bg-destructive/10 focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar Usuario
                </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar a {user.name} permanentemente?</AlertDialogTitle>
                    <AlertDialogDescription>
                        ¡Esta acción es irreversible! Se eliminará el perfil del usuario, todas sus publicaciones, comentarios y contenido asociado.
                        <br /><br />
                        <span className="font-semibold text-destructive">Nota:</span> Esto NO elimina la cuenta de inicio de sesión de Firebase del usuario. Podrían volver a registrarse.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                        {isDeleting ? 'Eliminando...' : 'Sí, eliminar permanentemente'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

const getTierBadge = (tier?: 'pro' | 'voice+' | 'lifetime') => {
    if (!tier) return <Badge variant="secondary">Gratis</Badge>;
    switch (tier) {
        case 'pro':
            return <Badge className="bg-blue-500 text-white hover:bg-blue-500/90"><Gem className="mr-1 h-3 w-3" /> Pro</Badge>
        case 'voice+':
            return <Badge className="bg-purple-500 text-white hover:bg-purple-500/90"><Sparkles className="mr-1 h-3 w-3" /> Voice+</Badge>
        case 'lifetime':
            return <Badge className="bg-amber-500 text-white hover:bg-amber-500/90"><CheckCircle className="mr-1 h-3 w-3" /> Lifetime</Badge>
        default:
            return <Badge variant="secondary">Gratis</Badge>;
    }
}


export const columns: ColumnDef<UserAccount>[] = [
  {
    accessorKey: "name",
    header: "Usuario",
    cell: ({ row }) => {
        const user = row.original;
        return (
             <div className="flex items-center gap-3">
                <Avatar>
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback><UserCircle /></AvatarFallback>
                </Avatar>
                <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                </div>
             </div>
        )
    },
  },
  {
    accessorKey: "subscriptionTier",
    header: "Suscripción",
    cell: ({ row }) => getTierBadge(row.getValue("subscriptionTier"))
  },
  {
    accessorKey: "isVerified",
    header: () => <div className="text-center">Verificado</div>,
    cell: ({ row }) => {
        const isVerified = row.getValue("isVerified") as boolean;
        return isVerified ? <CheckCircle className="h-5 w-5 text-blue-500 mx-auto" /> : null;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Fecha de Registro",
    cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return <div>{format(date, "d 'de' MMMM, yyyy", { locale: es })}</div>
    }
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row, table }) => {
       const { onUserDeleted } = (table.options.meta as any) || {};
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <EditUserDialog user={row.original} />
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="p-0">
               <DeleteUserDialog user={row.original} onUserDeleted={onUserDeleted} />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

interface UsersTableProps {
    data: UserAccount[];
    onUserDeleted: (id: string) => void;
}

export function UsersTable({ data, onUserDeleted }: UsersTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    meta: {
      onUserDeleted,
    },
  })

  return (
    <Card>
        <CardContent className="p-4">
        <div className="w-full">
            <div className="flex items-center py-4">
                <Input
                placeholder="Filtrar por nombre o email..."
                value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                    table.getColumn("name")?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
                />
            </div>
            <div className="rounded-md border">
                <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                        return (
                            <TableHead key={header.id}>
                            {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                )}
                            </TableHead>
                        )
                        })}
                    </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                        <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        >
                        {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                            {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                            )}
                            </TableCell>
                        ))}
                        </TableRow>
                    ))
                    ) : (
                    <TableRow>
                        <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                        >
                        No se encontraron resultados.
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Anterior
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Siguiente
                </Button>
                </div>
            </div>
            </div>
        </CardContent>
    </Card>
  )
}
