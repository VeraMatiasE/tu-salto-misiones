"use client"

import { useState } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
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
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Usuario } from "@/types/usuario"
import { useRouter } from "next/navigation"

type UsuariosListProps = {
  usuarios: Usuario[],
  onUsuarioDeleted?: (id: string) => void
}

export function UsuariosList({ usuarios, onUsuarioDeleted: onUsuarioDeleted }: UsuariosListProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (usuarioId: string, usuarioEmail: string) => {
    setDeletingId(usuarioId)
    
    try {
      const response = await fetch(`/api/usuarios/${usuarioId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
      }

      if (onUsuarioDeleted) {
        onUsuarioDeleted(usuarioId)
      } else {
        router.refresh()
      }
      
    } catch (error) {
      alert(`Error al eliminar ${usuarioEmail}: ${error.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="font-text">
              <TableHead className="font-bold">Nombre</TableHead>
              <TableHead className="font-bold">Email</TableHead>
              <TableHead className="font-bold">Rol</TableHead>
              <TableHead className="font-bold">Fecha de registro</TableHead>
              <TableHead className="text-right font-bold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.length === 0 ? (
              <TableRow className="font-text">
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  No hay usuarios registrados.
                </TableCell>
              </TableRow>
            ) : (
              usuarios.map((usuario) => (
                <TableRow key={usuario.id_usuario} className="font-text">
                  <TableCell className="font-medium">{usuario.nombre}</TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={usuario.rol ? "default" : "secondary"}
                    >
                      {usuario.rol ? "Administrador" : "Usuario"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(usuario.fecha_registro).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/dashboard/usuarios/${usuario.id_usuario}`}>
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
                              Esta acción no se puede deshacer. Se eliminará permanentemente la cuenta de{" "}
                              {usuario.nombre} y toda su información asociada.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
                            onClick={() => handleDelete(usuario.id_usuario, usuario.email)}
                          >
                            {deletingId === usuario.id_usuario ? (
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
    </div>
  )
}
