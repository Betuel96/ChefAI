
// src/components/admin/content-table.tsx
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
import { MoreHorizontal, UserCircle, PenSquare, MenuSquare, UtensilsCrossed, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
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
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import type { PublishedPost } from "@/types"
import { Badge } from "../ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import { deletePost } from "@/lib/community"

function DeleteContentDialog({ post, onPostDeleted }: { post: PublishedPost; onPostDeleted: (id: string) => void }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const { toast } = useToast();

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deletePost(post.id);
            toast({
                title: 'Publicación Eliminada',
                description: `La publicación de ${post.publisherName} ha sido eliminada.`,
            });
            onPostDeleted(post.id);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudo eliminar la publicación.',
                variant: 'destructive',
            })
        } finally {
            setIsDeleting(false);
            setIsOpen(false);
        }
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                <button className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-destructive focus:bg-destructive/10 focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar Publicación
                </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente la publicación
                        y todos sus datos asociados (comentarios, me gusta, etc.) de nuestros servidores.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                        {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

const getTypeBadge = (type?: 'recipe' | 'text' | 'menu') => {
    switch (type) {
        case 'recipe':
            return <Badge variant="secondary"><UtensilsCrossed className="mr-1 h-3 w-3" />Receta</Badge>
        case 'menu':
            return <Badge variant="secondary"><MenuSquare className="mr-1 h-3 w-3" />Menú</Badge>
        case 'text':
            return <Badge variant="secondary"><PenSquare className="mr-1 h-3 w-3" />Texto</Badge>
        default:
            return <Badge variant="outline">Desconocido</Badge>;
    }
}


export const columns: ColumnDef<PublishedPost>[] = [
  {
    accessorKey: "content",
    header: "Contenido",
    cell: ({ row }) => {
        const post = row.original;
        return (
             <div className="font-medium truncate max-w-xs">{post.content}</div>
        )
    },
  },
  {
    accessorKey: "publisherName",
    header: "Publicado por",
    cell: ({ row }) => {
        const post = row.original;
        return (
             <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={post.publisherPhotoURL || undefined} />
                    <AvatarFallback><UserCircle className="h-4 w-4" /></AvatarFallback>
                </Avatar>
                <span className="truncate">{post.publisherName}</span>
             </div>
        )
    },
  },
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => getTypeBadge(row.getValue("type"))
  },
  {
    accessorKey: "createdAt",
    header: "Fecha de Creación",
    cell: ({ row }) => {
        const dateString = row.getValue("createdAt") as string;
        if (!dateString) return null;
        const date = new Date(dateString);
        return <div>{format(date, "P", { locale: es })}</div>
    }
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row, table }) => {
      const { onPostDeleted } = (table.options.meta as any) || {};
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
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="p-0">
                <DeleteContentDialog post={row.original} onPostDeleted={onPostDeleted} />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

interface ContentTableProps {
    data: PublishedPost[];
    onPostDeleted: (id: string) => void;
}

export function ContentTable({ data, onPostDeleted }: ContentTableProps) {
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
        onPostDeleted,
    }
  })

  return (
    <Card>
        <CardContent className="p-4">
        <div className="w-full">
            <div className="flex items-center py-4">
                <Input
                    placeholder="Filtrar por contenido..."
                    value={(table.getColumn("content")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("content")?.setFilterValue(event.target.value)
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
