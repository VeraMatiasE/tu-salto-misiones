'use client'

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Search, X, Filter, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import Navigation from '@/components/navigation'
import Footer from '@/components/footer'
import { SaltoWithExtras } from '@/types/salto'
import { ApiResponse } from '@/types/database'
import { PaginatedResponse } from '@/types/pagination'
import { CldImage } from 'next-cloudinary'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { useRouter, useSearchParams } from 'next/navigation'

interface Filters {
  ubicaciones: string[]
  dificultades: string[]
  puntuacionMin: number
  puntuacionMax: number
  servicios: string[]
}

type SortType =
  | 'nombre-az'
  | 'nombre-za'
  | 'puntuacion-alta'
  | 'puntuacion-baja'
  | 'dificultad'

interface ApiFilters {
  search?: string
  ubicaciones?: string[]
  dificultades?: string[]
  puntuacionMin?: number
  puntuacionMax?: number
  servicios?: string[]
  sortBy?: string
  page?: number
  limit?: number
}

type PaginationItem = number | 'ellipsis-start' | 'ellipsis-end'

const fetchSaltos = async (
  filters: ApiFilters = {},
): Promise<ApiResponse<PaginatedResponse<SaltoWithExtras[]>>> => {
  const params = new URLSearchParams()

  if (filters.search) params.append('search', filters.search)
  if (filters.ubicaciones && filters.ubicaciones.length > 0) {
    params.append('ubicaciones', filters.ubicaciones.join(','))
  }
  if (filters.dificultades && filters.dificultades.length > 0) {
    params.append('dificultades', filters.dificultades.join(','))
  }
  if (filters.puntuacionMin !== undefined)
    params.append('puntuacionMin', filters.puntuacionMin.toString())
  if (filters.puntuacionMax !== undefined)
    params.append('puntuacionMax', filters.puntuacionMax.toString())
  if (filters.servicios && filters.servicios.length > 0) {
    params.append('infraestructura', filters.servicios.join(','))
  }
  if (filters.sortBy) params.append('sortBy', filters.sortBy)
  if (filters.page) params.append('page', filters.page.toString())
  if (filters.limit) params.append('limit', filters.limit.toString())

  const response = await fetch(`/api/destinos?${params.toString()}`)

  if (!response.ok) {
    throw new Error(`Error fetching saltos: ${response.statusText}`)
  }

  return response.json()
}

const fetchFilterOptions = async (): Promise<{
  ubicaciones: string[]
  dificultades: string[]
  servicios: string[]
}> => {
  const response = await fetch('/api/destinos/filter-options')

  if (!response.ok) {
    throw new Error(`Error fetching filter options: ${response.statusText}`)
  }

  return response.json()
}

export default function SaltosPageWrapper() {
  return (
    <Suspense fallback={<SaltosPageLoader />}>
      <SaltosPage />
    </Suspense>
  )
}

function SaltosPageLoader() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white">
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-teal-500" />
          <p className="text-gray-600">Cargando saltos...</p>
        </div>
      </div>
    </div>
  )
}

function SaltosPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [saltos, setSaltos] = useState<SaltoWithExtras[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState(() => {
    return searchParams.get('search') ?? ''
  })
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(() => {
    return searchParams.get('search') ?? ''
  })
  const [sortBy, setSortBy] = useState<SortType>('nombre-az')
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  })

  const [filterOptions, setFilterOptions] = useState<{
    ubicaciones: string[]
    dificultades: string[]
    servicios: string[]
  }>({
    ubicaciones: [],
    dificultades: [],
    servicios: [],
  })

  const [filters, setFilters] = useState<Filters>({
    ubicaciones: [],
    dificultades: [],
    puntuacionMin: 0,
    puntuacionMax: 5,
    servicios: [],
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)

      const params = new URLSearchParams(searchParams)
      if (searchTerm.trim()) {
        params.set('search', searchTerm.trim())
      } else {
        params.delete('search')
      }

      const newUrl = params.toString() ? `?${params.toString()}` : '/saltos'
      router.replace(newUrl, { scroll: false })
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, router, searchParams])

  useEffect(() => {
    const search = searchParams.get('search') ?? ''
    setSearchTerm(search)
    setDebouncedSearchTerm(search)
  }, [searchParams])

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchTerm, filters, sortBy])

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const options = await fetchFilterOptions()
        setFilterOptions(options)
      } catch (err) {
        console.error('Error loading filter options:', err)
        setFilterOptions({
          ubicaciones: [],
          dificultades: ['baja', 'media', 'alta', 'extrema'],
          servicios: [],
        })
      }
    }

    loadFilterOptions()
  }, [])

  const getSortByApi = useCallback((sortType: SortType): string => {
    switch (sortType) {
      case 'nombre-az':
        return 'nombre_asc'
      case 'nombre-za':
        return 'nombre_desc'
      case 'puntuacion-alta':
        return 'puntuacion_desc'
      case 'puntuacion-baja':
        return 'puntuacion_asc'
      case 'dificultad':
        return 'dificultad_asc'
      default:
        return 'nombre_asc'
    }
  }, [])

  const loadSaltos = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const apiFilters: ApiFilters = {
        search: debouncedSearchTerm || undefined,
        ubicaciones:
          filters.ubicaciones.length > 0 ? filters.ubicaciones : undefined,
        dificultades:
          filters.dificultades.length > 0 ? filters.dificultades : undefined,
        puntuacionMin:
          filters.puntuacionMin > 0 ? filters.puntuacionMin : undefined,
        puntuacionMax:
          filters.puntuacionMax < 5 ? filters.puntuacionMax : undefined,
        servicios: filters.servicios.length > 0 ? filters.servicios : undefined,
        sortBy: getSortByApi(sortBy),
        page: currentPage,
        limit: pagination.limit,
      }

      const response = await fetchSaltos(apiFilters)
      if (!response?.data) throw Error()

      setSaltos(response.data.data)
      setTotalResults(response.data.pagination.total)
      setTotalPages(response.data.pagination.totalPages)
      setPagination(response.data.pagination)
    } catch (err) {
      console.error('Error loading saltos:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Error desconocido al cargar los saltos',
      )
    } finally {
      setLoading(false)
    }
  }, [
    debouncedSearchTerm,
    filters,
    sortBy,
    pagination.limit,
    currentPage,
    getSortByApi,
  ])

  useEffect(() => {
    loadSaltos()
  }, [loadSaltos])

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.ubicaciones.length > 0) count++
    if (filters.dificultades.length > 0) count++
    if (filters.puntuacionMin > 0 || filters.puntuacionMax < 5) count++
    if (filters.servicios.length > 0) count++
    return count
  }, [filters])

  const clearAllFilters = () => {
    setFilters({
      ubicaciones: [],
      dificultades: [],
      puntuacionMin: 0,
      puntuacionMax: 5,
      servicios: [],
    })
    setSearchTerm('')
    setDebouncedSearchTerm('')
    setCurrentPage(1)
  }

  const toggleUbicacion = (ubicacion: string) => {
    setFilters((prev) => ({
      ...prev,
      ubicaciones: prev.ubicaciones.includes(ubicacion)
        ? prev.ubicaciones.filter((u) => u !== ubicacion)
        : [...prev.ubicaciones, ubicacion],
    }))
  }

  const toggleDificultad = (dificultad: string) => {
    setFilters((prev) => ({
      ...prev,
      dificultades: prev.dificultades.includes(dificultad)
        ? prev.dificultades.filter((d) => d !== dificultad)
        : [...prev.dificultades, dificultad],
    }))
  }

  const toggleServicio = (servicio: string) => {
    setFilters((prev) => ({
      ...prev,
      servicios: prev.servicios.includes(servicio)
        ? prev.servicios.filter((s) => s !== servicio)
        : [...prev.servicios, servicio],
    }))
  }

  const generatePaginationItems = () => {
    const items: PaginationItem[] = []
    const maxVisiblePages = 5

    const addPageRange = (start: number, end: number) => {
      for (let i = start; i <= end; i++) {
        items.push(i)
      }
    }

    if (totalPages <= maxVisiblePages) {
      addPageRange(1, totalPages)
      return items
    }

    items.push(1)

    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)

    if (start > 2) items.push('ellipsis-start')
    addPageRange(start, end)
    if (end < totalPages - 1) items.push('ellipsis-end')
    items.push(totalPages)

    return items
  }

  if (loading && saltos.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white">
        <Navigation variant="back" currentPage={'saltos'} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-teal-500" />
            <p className="text-gray-600">Cargando saltos...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white">
        <Navigation variant="back" currentPage={'saltos'} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error: {error}</p>
            <Button onClick={loadSaltos} variant="outline">
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white">
      <Navigation variant="back" currentPage={'saltos'} />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 py-12 md:py-16 px-4">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-64 h-64 mx-auto rounded-full">
              <Image src="/logo.png" alt="Logo" height={256} width={256} />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-6 md:mb-8 leading-tight">
            EXPLORA LOS SALTOS Y<br />
            CASCADAS DE MISIONES
          </h1>

          <div className="max-w-2xl mx-auto relative">
            <Input
              type="text"
              placeholder="Buscar por nombre, ubicación, servicios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-3 md:py-4 px-4 md:px-6 text-base md:text-lg rounded-full border-0 shadow-lg"
              disabled={loading}
            />
            <Button
              size="icon"
              className="absolute right-0 top-1/2 transform -translate-y-1/2 rounded-full bg-teal-500 hover:bg-teal-600"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
              ) : (
                <Search className="h-4 w-4 md:h-5 md:w-5" />
              )}
            </Button>
          </div>
        </div>
      </section>

      {/* Filters and Sort Section */}
      <section className="py-6 px-4 border-b bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
                disabled={loading}
              >
                <Filter className="h-4 w-4" />
                Filtros
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>

              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  onClick={clearAllFilters}
                  className="text-red-600 hover:text-red-700"
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpiar filtros
                </Button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Cargando...
                  </span>
                ) : (
                  <>
                    {totalResults} resultado
                    {totalResults !== 1 ? 's' : ''} encontrado
                    {totalResults !== 1 ? 's' : ''}
                    {totalResults > 0 && (
                      <span className="text-gray-400">
                        (página {currentPage} de {totalPages})
                      </span>
                    )}
                  </>
                )}
              </span>
              <Select
                value={sortBy}
                onValueChange={(value: SortType) => setSortBy(value)}
                disabled={loading}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nombre-az">Nombre A - Z</SelectItem>
                  <SelectItem value="nombre-za">Nombre Z - A</SelectItem>
                  <SelectItem value="puntuacion-alta">
                    Puntuación más alta
                  </SelectItem>
                  <SelectItem value="puntuacion-baja">
                    Puntuación más baja
                  </SelectItem>
                  <SelectItem value="dificultad">Dificultad</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {filters.ubicaciones.map((ubicacion) => (
                <Badge
                  key={ubicacion}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {ubicacion}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => toggleUbicacion(ubicacion)}
                  />
                </Badge>
              ))}
              {filters.dificultades.map((dificultad) => (
                <Badge
                  key={dificultad}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {dificultad}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => toggleDificultad(dificultad)}
                  />
                </Badge>
              ))}
              {filters.servicios.map((servicio) => (
                <Badge
                  key={servicio}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {servicio}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => toggleServicio(servicio)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <section className="py-6 px-4 bg-gray-50 border-b">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Ubicaciones */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Ubicación</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {filterOptions.ubicaciones.map((ubicacion) => (
                    <div
                      key={ubicacion}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`ubicacion-${ubicacion}`}
                        checked={filters.ubicaciones.includes(ubicacion)}
                        onCheckedChange={() => toggleUbicacion(ubicacion)}
                        disabled={loading}
                      />
                      <label
                        htmlFor={`ubicacion-${ubicacion}`}
                        className="text-sm cursor-pointer"
                      >
                        {ubicacion}
                      </label>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Dificultades */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Dificultad</h3>
                <div className="space-y-2">
                  {filterOptions.dificultades.map((dificultad) => (
                    <div
                      key={dificultad}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`dificultad-${dificultad}`}
                        checked={filters.dificultades.includes(dificultad)}
                        onCheckedChange={() => toggleDificultad(dificultad)}
                        disabled={loading}
                      />
                      <label
                        htmlFor={`dificultad-${dificultad}`}
                        className="text-sm cursor-pointer"
                      >
                        {dificultad}
                      </label>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Servicios */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Servicios</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {filterOptions.servicios.map((servicio) => (
                    <div key={servicio} className="flex items-center space-x-2">
                      <Checkbox
                        id={`servicio-${servicio}`}
                        checked={filters.servicios.includes(servicio)}
                        onCheckedChange={() => toggleServicio(servicio)}
                        disabled={loading}
                      />
                      <label
                        htmlFor={`servicio-${servicio}`}
                        className="text-sm cursor-pointer"
                      >
                        {servicio}
                      </label>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Puntuación */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Puntuación</h3>
                <div className="space-y-4">
                  <div className="px-2">
                    <Slider
                      value={[filters.puntuacionMin, filters.puntuacionMax]}
                      onValueChange={([min, max]) =>
                        setFilters((prev) => ({
                          ...prev,
                          puntuacionMin: min,
                          puntuacionMax: max,
                        }))
                      }
                      max={5}
                      min={0}
                      step={0.1}
                      className="w-full"
                      disabled={loading}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{filters.puntuacionMin.toFixed(1)}</span>
                    <span>{filters.puntuacionMax.toFixed(1)}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Saltos List */}
      <section className="pb-16 px-4">
        <div className="max-w-4xl mx-auto space-y-6 mt-8">
          {loading && Array.isArray(saltos) && saltos.length > 0 && (
            <div className="text-center py-4">
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-teal-500" />
            </div>
          )}
          {Array.isArray(saltos)
            && saltos.map((salto) => (
              <Card
                key={salto.id_destino}
                className="overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    <div className="relative h-48 md:h-40 md:w-64 flex-shrink-0">
                      {salto.public_id ? (
                        <CldImage
                          src={salto.public_id}
                          alt={salto.nombre}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <Image
                          src="/placeholder.svg"
                          alt={salto.nombre}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    {/* Content */}
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
                          {salto.nombre}
                        </h3>
                        <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-4 line-clamp-3">
                          {salto.descripcion}
                        </p>
                        {/* Metadata */}
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 mb-4">
                          <span>
                            <strong>Ubicación:</strong> {salto.ubicacion}
                          </span>
                          <span>
                            <strong>Dificultad:</strong> {salto.dificultad}
                          </span>
                          <span>
                            <strong>Puntuación:</strong> {salto.puntuacion}/5
                          </span>
                        </div>
                        {/* Servicios */}
                        <div className="flex flex-wrap gap-1 mb-4">
                          {Array.isArray(salto.infraestructura)
                            && salto.infraestructura.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-4">
                                {salto.infraestructura
                                  .slice(0, 3)
                                  .map((servicio) => (
                                    <Badge
                                      key={servicio}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {servicio}
                                    </Badge>
                                  ))}
                                {salto.infraestructura.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{salto.infraestructura.length - 3} más
                                  </Badge>
                                )}
                              </div>
                            )}
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Link href={`/salto/${salto.id_destino}`}>
                          <Button className="bg-teal-500 hover:bg-teal-600 text-white rounded-full px-6">
                            Ver Más
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

          {/* Pagination */}
          {totalPages > 1 && !loading && (
            <div className="mt-8 mb-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        currentPage > 1 && setCurrentPage(currentPage - 1)
                      }
                      className={
                        currentPage <= 1
                          ? 'pointer-events-none opacity-50'
                          : 'cursor-pointer'
                      }
                    />
                  </PaginationItem>

                  {generatePaginationItems().map((item, index) => (
                    <PaginationItem key={`pag-${index}`}>
                      {item === 'ellipsis-start' || item === 'ellipsis-end' ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          onClick={() => setCurrentPage(Number(item))}
                          isActive={currentPage === item}
                          className="cursor-pointer"
                        >
                          {item}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        currentPage < totalPages
                        && setCurrentPage(currentPage + 1)
                      }
                      className={
                        currentPage >= totalPages
                          ? 'pointer-events-none opacity-50'
                          : 'cursor-pointer'
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}

          {!loading && (!Array.isArray(saltos) || saltos.length === 0) && (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                {/* Icono ilustrativo */}
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>

                {/* Mensaje principal */}
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  No encontramos saltos
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  No hay saltos que coincidan con los filtros aplicados. Intenta
                  ajustar tus criterios de búsqueda o explora todas las opciones
                  disponibles.
                </p>

                {/* Botones de acción */}
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={clearAllFilters}
                    className="w-full border-teal-500 text-teal-600 hover:bg-teal-50"
                  >
                    Limpiar todos los filtros
                  </Button>
                  <p className="text-sm text-gray-500">
                    o explora todos los saltos disponibles
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
