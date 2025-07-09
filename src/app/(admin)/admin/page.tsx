// src/app/(admin)/admin/page.tsx
import { DashboardCards } from "@/components/admin/dashboard-cards"
import { getAllUsers, getAllPublishedContent } from "@/lib/admin";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

async function DashboardData() {
    const [users, content] = await Promise.all([
        getAllUsers(),
        getAllPublishedContent()
    ]).catch(err => {
        console.error("Failed to fetch admin dashboard data:", err);
        return [[], []]; // Return empty arrays on error
    });
    
    const metrics = {
        totalRevenue: 45678.90, // This remains as an example.
        totalUsers: users.length,
        totalContent: content.length
    };

    return <DashboardCards metrics={metrics} />;
}

const DashboardSkeleton = () => (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
    </div>
);


export default function AdminDashboardPage() {
    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">Panel Principal</h1>
                <p className="text-muted-foreground">Un resumen del rendimiento de tu plataforma.</p>
            </header>
            <Suspense fallback={<DashboardSkeleton />}>
                <DashboardData />
            </Suspense>
        </div>
    )
}
