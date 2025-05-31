import { SaltoForm } from "@/components/salto-form";

export default function NuevoSaltoPage() {
  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="font-title text-3xl font-bold tracking-tight">Nuevo Salto o Cascada</h1>
        <p className="font-text text-muted-foreground mt-1">Ingresa la información del nuevo destino turístico</p>
      </div>

      <SaltoForm />
    </div>
  )
}
