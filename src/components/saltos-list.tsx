'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, MapPin } from 'lucide-react'
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
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { SaltoConId } from '@/types/salto'

type SaltosListProps = Readonly<{
  saltos: SaltoConId[]
  onSaltoDeleted?: (id: string) => void
}>

export function SaltosList({ saltos, onSaltoDeleted }: SaltosListProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const getDificultadColor = (dificultad: string) => {
    switch (dificultad) {
      case 'baja':
        return 'bg-header text-text-secondary'
      case 'media':
        return 'bg-accent text-text-secondary'
      case 'alta':
        return 'bg-primary text-white'
      case 'extrema':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleDelete = async (saltoId: string, saltoNombre: string) => {
    setDeletingId(saltoId)

    try {
      const response = await fetch(`/api/destinos/${saltoId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.message
            ?? `Error ${response.status}: ${response.statusText}`,
        )
      }

      if (onSaltoDeleted) {
        onSaltoDeleted(saltoId)
      } else {
        router.refresh()
      }
    } catch (error) {
      alert(`Error al eliminar ${saltoNombre}: ${error.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="font-text">
            <TableHead className="font-bold">Nombre</TableHead>
            <TableHead className="font-bold">Ubicación</TableHead>
            <TableHead className="font-bold">Costo</TableHead>
            <TableHead className="font-bold">Dificultad</TableHead>
            <TableHead className="font-bold text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {saltos.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="font-text text-center py-6 text-muted-foreground"
              >
                No hay saltos registrados. Agrega uno nuevo para comenzar.
              </TableCell>
            </TableRow>
          ) : (
            saltos.map((salto) => (
              <TableRow key={salto.id_destino} className="font-text">
                <TableCell className="font-medium">{salto.nombre}</TableCell>
                <TableCell>
                  <a
                    href={salto.url_mapa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:underline"
                  >
                    <MapPin className="h-3 w-3 mr-1" />
                    {salto.ubicacion}
                  </a>
                </TableCell>
                <TableCell>
                  {salto.costo_entrada === 0 ? (
                    <span className="text-green-600">Gratuito</span>
                  ) : (
                    <span className="text-amber-600">
                      ${salto.costo_entrada}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={getDificultadColor(salto.dificultad)}>
                    {salto.dificultad.charAt(0).toUpperCase()
                      + salto.dificultad.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/dashboard/saltos/${salto.id_destino}`}>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-sky-600 border-sky-600 hover:bg-sky-100"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-red-500 border-red-500 hover:bg-red-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará
                            permanentemente el registro de {salto.nombre} y toda
                            su información asociada.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
                            disabled={deletingId === salto.id_destino}
                            onClick={() =>
                              handleDelete(salto.id_destino, salto.nombre)
                            }
                          >
                            {deletingId === salto.id_destino ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Eliminando...
                              </>
                            ) : (
                              'Eliminar definitivamente'
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
