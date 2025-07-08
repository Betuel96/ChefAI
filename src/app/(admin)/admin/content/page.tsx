// src/app/(admin)/admin/content/page.tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Construction } from "lucide-react"

export default function AdminContentPage() {
    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">Gestión de Contenido</h1>
                <p className="text-muted-foreground">Modera las publicaciones de la comunidad.</p>
            </header>
            <Card>
                <CardHeader>
                    <CardTitle>Próximamente</CardTitle>
                     <CardDescription>
                       Esta sección está en desarrollo.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center text-muted-foreground min-h-60">
                    <Construction className="w-16 h-16 mb-4" />
                    <p>Aquí podrás ver y eliminar publicaciones de los usuarios.</p>
                </CardContent>
            </Card>
        </div>
    )
}
