// src/app/(admin)/admin/page.tsx
import { DashboardCards } from "@/components/admin/dashboard-cards"

export default function AdminDashboardPage() {
    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">Panel Principal</h1>
                <p className="text-muted-foreground">Un resumen del rendimiento de tu plataforma.</p>
            </header>
            <DashboardCards />
        </div>
    )
}
