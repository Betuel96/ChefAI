// src/components/admin/dashboard-cards.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Newspaper, DollarSign } from "lucide-react"

export function DashboardCards() {
    // En una aplicación real, estos datos se obtendrían de Firestore.
    const metrics = {
        totalRevenue: 45678.90,
        totalUsers: 789,
        totalContent: 1234
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        ${metrics.totalRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
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
                    <p className="text-xs text-muted-foreground">+180.1% desde el mes pasado</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Contenido Publicado</CardTitle>
                    <Newspaper className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{metrics.totalContent}</div>
                    <p className="text-xs text-muted-foreground">+19% desde el mes pasado</p>
                </CardContent>
            </Card>
        </div>
    )
}
