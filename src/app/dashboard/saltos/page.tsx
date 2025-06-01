'use client'
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { SaltosList } from "@/components/saltos-list"
import { SaltoConId } from "@/types/salto"

export default function SaltosAdminPage() {
  const [saltos, setSaltos] = useState<SaltoConId[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/destinos')
      .then(res => res.json())
      .then(data => {
        setSaltos(data.data)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error al cargar los saltos:', error)
        setLoading(false)
      })
  }, [])
  
  const handleSaltoDeleted = (deletedId: string) => {
    setSaltos(prev => prev.filter(salto => salto.id_destino !== deletedId))
  }

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-title text-3xl font-bold tracking-tight">Administración de Saltos y Cascadas</h1>
          <p className="font-text text-muted-foreground mt-1">Gestiona la información de los saltos y cascadas turísticas</p>
        </div>
        <Link href="/dashboard/saltos/nuevo">
          <Button className="bg-primary hover:bg-accent text-white">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo Salto
          </Button>
        </Link>
      </div>

      {loading ? (
        <p className="font-text text-muted-foreground">Cargando saltos...</p>
      ) : (
        <SaltosList saltos={saltos} onSaltoDeleted={handleSaltoDeleted} />
      )}
    </div>
  )
}
