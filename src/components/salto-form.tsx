'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Control,
  ControllerRenderProps,
  FieldPath,
  useForm,
  UseFormReturn,
} from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { MapPin } from 'lucide-react'
import { Salto, SaltoFormProps } from '@/types/salto'

// Esquema de validación para el formulario
const formSchema = z.object({
  nombre: z.string().min(3, {
    message: 'El nombre debe tener al menos 3 caracteres.',
  }),
  descripcion: z.string().min(10, {
    message: 'La descripción debe tener al menos 10 caracteres.',
  }),
  ubicacion: z.string().min(5, {
    message: 'La ubicación debe de tener al menos 5 caracteres.',
  }),
  url_mapa: z.string().url({
    message: 'Ingresa una URL válida de Google Maps.',
  }),
  costo_entrada: z
    .number()
    .min(0, { message: 'El valor debe de ser mayor o igual a 0' }),
  infraestructura: z.array(z.string()).optional(),
  biodiversidad: z.string().min(10, {
    message: 'La descripción debe tener al menos 10 caracteres.',
  }),
  dificultad: z.enum(['baja', 'media', 'alta', 'extrema']),
})

type FormValues = z.infer<typeof formSchema>
type FormField = ControllerRenderProps<FormValues, FieldPath<FormValues>>
type UseFormType = UseFormReturn<FormValues>

interface InfraestructuraOption {
  id: string
  label: string
}

// Opciones para infraestructura
const opcionesInfraestructura = [
  { id: 'baños', label: 'Baños' },
  { id: 'estacionamiento', label: 'Estacionamiento' },
  { id: 'camping', label: 'Áreas de camping' },
  { id: 'guias', label: 'Guías turísticos' },
  { id: 'senderos', label: 'Senderos señalizados' },
  { id: 'miradores', label: 'Miradores' },
]

// Función helper para parsear infraestructura
const parseInfraestructura = (
  infraestructura: string | string[] | undefined,
): string[] => {
  if (typeof infraestructura === 'string') {
    return JSON.parse(infraestructura)
  }
  if (Array.isArray(infraestructura)) {
    return infraestructura
  }
  return []
}

// Función helper para obtener valores por defecto
const getDefaultValues = (initialData?: Salto) => {
  if (!initialData) {
    return {
      nombre: '',
      descripcion: '',
      ubicacion: '',
      url_mapa: '',
      costo_entrada: 0,
      infraestructura: [],
      biodiversidad: '',
      dificultad: 'media' as const,
    }
  }

  return {
    nombre: initialData.nombre,
    descripcion: initialData.descripcion,
    ubicacion: initialData.ubicacion,
    url_mapa: initialData.url_mapa,
    costo_entrada: initialData.costo_entrada,
    infraestructura: parseInfraestructura(initialData.infraestructura),
    biodiversidad: initialData.biodiversidad,
    dificultad: initialData.dificultad,
  }
}

// Función helper para texto del botón
const getButtonText = (isSubmitting: boolean, initialData?: Salto): string => {
  if (isSubmitting) return 'Guardando...'
  if (initialData) return 'Actualizar'
  return 'Crear'
}

// Componente para el campo de infraestructura
const InfraestructuraField = ({ form }: { form: UseFormType }) => (
  <FormField
    control={form.control}
    name="infraestructura"
    render={() => (
      <FormItem>
        <div className="mb-4">
          <FormLabel className="text-base">
            Infraestructura disponible
          </FormLabel>
          <FormDescription>
            Selecciona todas las opciones que apliquen
          </FormDescription>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {opcionesInfraestructura.map((item) => (
            <InfraestructuraCheckbox key={item.id} item={item} form={form} />
          ))}
        </div>
        <FormMessage />
      </FormItem>
    )}
  />
)

// Componente para cada checkbox de infraestructura
const InfraestructuraCheckbox = ({
  item,
  form,
}: {
  item: InfraestructuraOption
  form: UseFormType
}) => (
  <FormField
    control={form.control}
    name="infraestructura"
    render={({ field }) => (
      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
        <FormControl>
          <Checkbox
            checked={field.value?.includes(item.id)}
            onCheckedChange={(checked) =>
              handleInfraestructuraChange(
                checked === 'indeterminate' ? false : checked,
                item.id,
                field,
              )
            }
          />
        </FormControl>
        <FormLabel className="font-normal cursor-pointer">
          {item.label}
        </FormLabel>
      </FormItem>
    )}
  />
)

const addItem = (
  itemId: string,
  field: ControllerRenderProps<FormValues, 'infraestructura'>,
) => {
  field.onChange([...(field.value || []), itemId])
}

const removeItem = (
  itemId: string,
  field: ControllerRenderProps<FormValues, 'infraestructura'>,
) => {
  field.onChange(field.value?.filter((value: string) => value !== itemId))
}

const handleInfraestructuraChange = (
  checked: boolean,
  itemId: string,
  field: ControllerRenderProps<FormValues, 'infraestructura'>,
) => {
  if (checked) {
    addItem(itemId, field)
  } else {
    removeItem(itemId, field)
  }
}

// Componente para el campo de nombre
const NombreField = ({
  control,
}: {
  control: Control<z.infer<typeof formSchema>>
}) => (
  <FormField
    control={control}
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
)

// Componente para el campo de ubicación
const UbicacionField = ({
  control,
}: {
  control: Control<z.infer<typeof formSchema>>
}) => (
  <FormField
    control={control}
    name="ubicacion"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Ubicación</FormLabel>
        <FormControl>
          <div className="relative">
            <Input
              aria-label="Ubicacion"
              placeholder="Ej: Cataratas del Iguazú, Misiones"
              {...field}
            />
            <MapPin className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
        </FormControl>
        <FormDescription>Formato: latitud, longitud</FormDescription>
        <FormMessage />
      </FormItem>
    )}
  />
)

// Componente para el campo de URL del mapa
const UrlMapaField = ({
  control,
}: {
  control: Control<z.infer<typeof formSchema>>
}) => (
  <FormField
    control={control}
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
)

// Componente para el campo de costo
const CostoField = ({
  control,
  handleCostoChange,
}: {
  control: Control<z.infer<typeof formSchema>>
  handleCostoChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    field: ControllerRenderProps<FormValues, 'costo_entrada'>,
  ) => void
}) => (
  <FormField
    control={control}
    name="costo_entrada"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Costo (ARS)</FormLabel>
        <FormControl>
          <Input
            type="number"
            placeholder="0"
            {...field}
            onChange={(e) => handleCostoChange(e, field)}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
)

// Componente para el campo de descripción
const DescripcionField = ({
  control,
}: {
  control: Control<z.infer<typeof formSchema>>
}) => (
  <FormField
    control={control}
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
          Incluye altura, caudal, formación rocosa, pozas y características
          distintivas del salto.
        </FormDescription>
        <FormMessage />
      </FormItem>
    )}
  />
)

// Componente para el campo de dificultad
const DificultadField = ({
  control,
}: {
  control: Control<z.infer<typeof formSchema>>
}) => (
  <FormField
    control={control}
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
            <SelectItem value="media">
              Media - Requiere caminata moderada
            </SelectItem>
            <SelectItem value="alta">
              Alta - Requiere buena condición física
            </SelectItem>
            <SelectItem value="extrema">
              Extrema - Para personas experimentadas
            </SelectItem>
          </SelectContent>
        </Select>
        <FormDescription>
          Indica qué tan difícil es llegar al destino
        </FormDescription>
        <FormMessage />
      </FormItem>
    )}
  />
)

// Componente para el campo de biodiversidad
const BiodiversidadField = ({
  control,
}: {
  control: Control<z.infer<typeof formSchema>>
}) => (
  <FormField
    control={control}
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
          Incluye información sobre especies nativas, vegetación y animales
          característicos.
        </FormDescription>
        <FormMessage />
      </FormItem>
    )}
  />
)

// Componente para la pestaña de información básica
const InformacionBasicaTab = ({
  control,
  handleCostoChange,
}: {
  control: Control<z.infer<typeof formSchema>>
  handleCostoChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    field: ControllerRenderProps<FormValues, 'costo_entrada'>,
  ) => void
}) => (
  <TabsContent value="informacion" className="space-y-6 pt-4">
    <NombreField control={control} />

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <UbicacionField control={control} />
      <UrlMapaField control={control} />
    </div>

    <CostoField control={control} handleCostoChange={handleCostoChange} />
    <DescripcionField control={control} />
  </TabsContent>
)

// Componente para la pestaña de características
const CaracteristicasTab = ({
  control,
  form,
}: {
  control: Control<z.infer<typeof formSchema>>
  form: UseFormReturn<z.infer<typeof formSchema>>
}) => (
  <TabsContent value="caracteristicas" className="space-y-6 pt-4">
    <DificultadField control={control} />
    <InfraestructuraField form={form} />
    <BiodiversidadField control={control} />
  </TabsContent>
)

// Componente para los botones de acción
const ActionButtons = ({
  isSubmitting,
  initialData,
  handleCancel,
}: {
  isSubmitting: boolean
  initialData: SaltoFormProps['initialData']
  handleCancel: () => void
}) => (
  <div className="flex justify-end gap-4 pt-4 border-t">
    <Button type="button" variant="outline" onClick={handleCancel}>
      Cancelar
    </Button>
    <Button type="submit" disabled={isSubmitting} variant="default">
      {getButtonText(isSubmitting, initialData)}
    </Button>
  </div>
)

export function SaltoForm({ initialData }: SaltoFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(initialData),
  })

  // Función para manejar el envío del formulario
  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)

    const isEditing = Boolean(initialData?.id_destino)
    const action = isEditing ? 'actualizar' : 'crear'

    try {
      const url = isEditing
        ? `/api/destinos/${initialData?.id_destino}`
        : '/api/destinos'

      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      router.push('/dashboard/saltos')
      router.refresh()
    } catch (error) {
      console.error(`Error al ${action} el salto:`, error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/dashboard/saltos')
  }

  const handleCostoChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: ControllerRenderProps<FormValues, 'costo_entrada'>,
  ) => {
    field.onChange(e.target.value ? Number(e.target.value) : 0)
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        aria-label="test"
        className="space-y-8"
      >
        <Tabs defaultValue="informacion" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="informacion">Información básica</TabsTrigger>
            <TabsTrigger value="caracteristicas">Características</TabsTrigger>
          </TabsList>

          <InformacionBasicaTab
            control={form.control}
            handleCostoChange={handleCostoChange}
          />
          <CaracteristicasTab control={form.control} form={form} />
        </Tabs>

        <ActionButtons
          isSubmitting={isSubmitting}
          initialData={initialData}
          handleCancel={handleCancel}
        />
      </form>
    </Form>
  )
}
