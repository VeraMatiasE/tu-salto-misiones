import { UsuarioForm } from "@/components/usuario-form"

export default function NuevoUsuarioPage() {
  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="font-title text-3xl font-bold tracking-tight">Nuevo Usuario</h1>
        <p className="font-text text-muted-foreground mt-1">Crea un nuevo usuario en la plataforma</p>
      </div>

      <UsuarioForm />
    </div>
  )
}
