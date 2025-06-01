"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { MapPin } from "lucide-react"
import { SaltoFormProps } from "@/types/salto"

// Esquema de validación para el formulario
const formSchema = z.object({
  nombre: z.string().min(3, {
    message: "El nombre debe tener al menos 3 caracteres.",
  }),
  descripcion: z.string().min(10, {
    message: "La descripción debe tener al menos 10 caracteres.",
  }),
  ubicacion: z.string().min(5, {
    message: "Ingresa coordenadas válidas.",
  }),
  url_mapa: z.string().url({
    message: "Ingresa una URL válida de Google Maps.",
  }),
  costo_entrada: z.number().min(0, { message: "El valor debe de ser mayor o igual a 0" }),
  infraestructura: z.array(z.string()).optional(),
  biodiversidad: z.string().min(10, {
    message: "La descripción debe tener al menos 10 caracteres.",
  }),
  dificultad: z.enum(["baja", "media", "alta", "extrema"]),
})

// Opciones para infraestructura
const opcionesInfraestructura = [
  { id: "baños", label: "Baños" },
  { id: "estacionamiento", label: "Estacionamiento" },
  { id: "camping", label: "Áreas de camping" },
  { id: "guias", label: "Guías turísticos" },
  { id: "senderos", label: "Senderos señalizados" },
  { id: "miradores", label: "Miradores" },
]

export function SaltoForm({ initialData }: SaltoFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Inicializar el formulario con datos existentes o valores por defecto
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          nombre: initialData.nombre,
          descripcion: initialData.descripcion,
          ubicacion: initialData.ubicacion,
          url_mapa: initialData.url_mapa,
          costo_entrada: initialData.costo_entrada,
          infraestructura: (() => {
            if (typeof initialData?.infraestructura === 'string') {
              return JSON.parse(initialData.infraestructura)
            }
            return Array.isArray(initialData?.infraestructura) ? initialData.infraestructura : []
          })(),
          biodiversidad: initialData.biodiversidad,
          dificultad: initialData.dificultad,
        }
      : {
          nombre: "",
          descripcion: "",
          ubicacion: "",
          url_mapa: "",
          costo_entrada: 0,
          infraestructura: [],
          biodiversidad: "",
          dificultad: "media",
        },
  })

  // Función para manejar el envío del formulario
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    const isEditing = Boolean(initialData?.id_destino)
    const action = isEditing ? 'actualizar' : 'crear'

    try {
      const response = await fetch(
        isEditing ? `/api/destinos/${initialData?.id_destino}` : '/api/destinos',
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      router.push("/dashboard/saltos")
      router.refresh()
    } catch (error) {
      console.error(`Error al ${action} el salto:`, error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Tabs defaultValue="informacion" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="informacion">Información básica</TabsTrigger>
            <TabsTrigger value="caracteristicas">Características</TabsTrigger>
          </TabsList>

          {/* Pestaña de información básica */}
           <TabsContent value="informacion" className="space-y-6 pt-4">
             <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del destino</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Salto del Arcoiris" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            /> 

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="ubicacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coordenadas</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input placeholder="Ej. -27.0875, -54.4444" {...field} />
                        <MapPin className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      </div>
                    </FormControl>
                    <FormDescription>Formato: latitud, longitud</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="url_mapa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link a Google Maps</FormLabel>
                    <FormControl>
                      <Input placeholder="https://maps.google.com/?q=..." {...field} />
                    </FormControl>
                    <FormDescription>URL completa de Google Maps</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="costo_entrada"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Costo (ARS)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                      />
                    </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción del salto</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe las características del salto..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                     Incluye altura, caudal, formación rocosa, pozas y características distintivas del salto.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          {/* Pestaña de características */}
          <TabsContent value="caracteristicas" className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="dificultad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nivel de dificultad del acceso</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el nivel de dificultad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="baja">Baja - Acceso fácil</SelectItem>
                      <SelectItem value="media">Media - Requiere caminata moderada</SelectItem>
                      <SelectItem value="alta">Alta - Requiere buena condición física</SelectItem>
                      <SelectItem value="extrema">Extrema - Para personas experimentadas</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Indica qué tan difícil es llegar al destino</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="infraestructura"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Infraestructura disponible</FormLabel>
                    <FormDescription>Selecciona todas las opciones que apliquen</FormDescription>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {opcionesInfraestructura.map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name="infraestructura"
                        render={({ field }) => {
                          return (
                            <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), item.id])
                                      : field.onChange(field.value?.filter((value) => value !== item.id))
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">{item.label}</FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="biodiversidad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Flora y fauna</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe la biodiversidad del área..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Incluye información sobre especies nativas, vegetación y animales característicos.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>


        <div className="flex justify-end gap-4 pt-4 border-t">
           <Button type="button" variant="outline" onClick={() => router.push("/dashboard/saltos")}>
             Cancelar
           </Button>
           <Button type="submit" disabled={isSubmitting} variant="default">
             {isSubmitting ? "Guardando..." : initialData ? "Actualizar" : "Crear"}
           </Button>
         </div>
      </form>
    </Form>
  )
}
