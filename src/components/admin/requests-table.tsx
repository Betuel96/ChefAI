// src/components/admin/requests-table.tsx
"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Check, X, Link as LinkIcon, UserCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import type { VerificationRequest } from "@/types"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import { approveVerificationRequest, declineVerificationRequest } from "@/lib/admin"
import Link from "next/link"

interface RequestsTableProps {
    data: VerificationRequest[];
    onRequestProcessed: (id: string) => void;
}

export function RequestsTable({ data, onRequestProcessed }: RequestsTableProps) {
  const { toast } = useToast();
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  const handleApprove = async (request: VerificationRequest) => {
    setProcessingId(request.id);
    try {
        await approveVerificationRequest(request.id, request.userId);
        toast({ title: 'Solicitud Aprobada', description: `${request.userName} ahora es un usuario verificado.` });
        onRequestProcessed(request.id);
    } catch (error) {
        toast({ title: 'Error', description: 'No se pudo aprobar la solicitud.', variant: 'destructive' });
    } finally {
        setProcessingId(null);
    }
  }

  const handleDecline = async (request: VerificationRequest) => {
    setProcessingId(request.id);
     try {
        await declineVerificationRequest(request.id, request.userId);
        toast({ title: 'Solicitud Rechazada' });
        onRequestProcessed(request.id);
    } catch (error) {
        toast({ title: 'Error', description: 'No se pudo rechazar la solicitud.', variant: 'destructive' });
    } finally {
        setProcessingId(null);
    }
  }

  const columns: ColumnDef<VerificationRequest>[] = [
    {
      accessorKey: "userName",
      header: "Usuario",
      cell: ({ row }) => {
          const request = row.original;
          return (
                <div className="flex items-center gap-2">
                    <UserCircle className="h-5 w-5 text-muted-foreground" />
                    <div>
                        <div className="font-medium">{request.userName}</div>
                        <div className="text-xs text-muted-foreground">{request.userEmail}</div>
                    </div>
                </div>
          )
      },
    },
    {
      accessorKey: "reason",
      header: "Razón",
      cell: ({ row }) => <p className="max-w-xs truncate">{row.getValue("reason")}</p>,
    },
    {
      accessorKey: "link",
      header: "Enlace",
      cell: ({ row }) => {
        const link = row.getValue("link") as string;
        return (
            <Button variant="ghost" size="icon" asChild>
                <Link href={link} target="_blank" rel="noopener noreferrer">
                    <LinkIcon className="h-4 w-4" />
                </Link>
            </Button>
        )
      }
    },
    {
        accessorKey: "createdAt",
        header: "Fecha de Solicitud",
        cell: ({ row }) => {
            const date = new Date(row.getValue("createdAt"));
            return <div>{formatDistanceToNow(date, { addSuffix: true, locale: es })}</div>
        }
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const request = row.original;
        const isProcessing = processingId === request.id;
        return (
            <div className="flex gap-2">
                <Button variant="default" size="sm" onClick={() => handleApprove(request)} disabled={isProcessing}>
                    <Check className="h-4 w-4" />
                    <span className="ml-2 hidden sm:inline">Aprobar</span>
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDecline(request)} disabled={isProcessing}>
                    <X className="h-4 w-4" />
                    <span className="ml-2 hidden sm:inline">Rechazar</span>
                </Button>
            </div>
        )
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <Card>
        <CardContent className="p-4">
        <div className="w-full">
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
                        No hay solicitudes pendientes.
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
