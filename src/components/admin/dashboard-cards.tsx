// src/components/admin/dashboard-cards.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Newspaper, DollarSign } from "lucide-react"

interface DashboardCardsProps {
    metrics: {
        totalRevenue: number;
        totalUsers: number;
        totalContent: number;
    }
}

export function DashboardCards({ metrics }: DashboardCardsProps) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ingresos Totales (Ejemplo)</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        ${metrics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground">Ingresos de todo el tiempo</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Usuarios Totales</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{metrics.totalUsers}</div>
                    <p className="text-xs text-muted-foreground">Cuentas registradas en la plataforma</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Contenido Publicado</CardTitle>
                    <Newspaper className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{metrics.totalContent}</div>
                    <p className="text-xs text-muted-foreground">Publicaciones totales en la comunidad</p>
                </CardContent>
            </Card>
        </div>
    )
}
