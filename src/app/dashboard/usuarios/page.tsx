'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { UsuariosList } from "@/components/usuarios-list"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Usuario } from "@/types/usuario"

export default function UsuariosAdminPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage] = useState(10)

  useEffect(() => {
    fetch(
        `/api/usuarios?page=${currentPage}&limit=${itemsPerPage}`
      )
      .then(res => res.json())
      .then(res => {
        setUsuarios(res.data)
        setTotalPages(res.pagination?.totalPages || 0)
        setTotalItems(res.pagination?.total || 0)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error al cargar los usuarios:', error)
        setLoading(false)
      })
  }, [currentPage, itemsPerPage, totalPages])

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const handleUsuarioDeleted = (deletedId: string) => {
    const updatedUsuarios = usuarios.filter(usuario => usuario.id_usuario !== deletedId)
    setUsuarios(updatedUsuarios)

    const newTotalItems = totalItems - 1
    const newTotalPages = Math.ceil(newTotalItems / itemsPerPage)

    setTotalPages(newTotalItems)
    setTotalPages(newTotalPages)

    const remainingUsersInCurrentPage = updatedUsuarios.length

    if (remainingUsersInCurrentPage === 0 && currentPage > 1) {
      setCurrentPage(currentPage - 1)
    } else if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages)
    }

  }

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-title text-3xl font-bold tracking-tight">Administración de Usuarios</h1>
          <p className="font-text text-muted-foreground mt-1">Gestiona los usuarios registrados en la plataforma</p>
        </div>
        <Link href="/dashboard/usuarios/nuevo">
          <Button className="bg-primary hover:bg-accent text-white">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Button>
        </Link>
      </div>

      {loading ? (
        <p className="font-text text-muted-foreground">Cargando usuarios...</p>
          ) : (
            <>
              <UsuariosList usuarios={usuarios} onUsuarioDeleted={handleUsuarioDeleted}/>

              {totalPages > 1 && (
                <Pagination className="py-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(currentPage - 1)}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                    </PaginationItem>
                 
                    {Array.from({ length: totalPages }).map((_, index) => (
                      <PaginationItem key={index}>
                        <PaginationLink
                            onClick={() => handlePageChange(index + 1)}
                            isActive={currentPage === index + 1}
                        >
                          {index + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(currentPage + 1)}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
      )}
    </div>
  )
}
