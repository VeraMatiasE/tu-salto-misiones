export type Salto = {
  id: string
  nombre: string
  ubicacion: string
  url_map: string
  costo: number
  dificultad: "baja" | "media" | "alta" | "extrema"
}

export type SaltoFormProps = {
  initialData?: {
    nombre: string
    ubicacion: string
    url_map: string
    costo_entrada: number
    infraestructura: [string]
    biodiversidad: string
    dificultad: 'baja' | 'media' | 'alta' | 'extrema' | undefined
    servicios: string[] | undefined
  }
}