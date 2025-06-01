export type Salto = {
  id_destino: string
  descripcion: string
  nombre: string
  ubicacion: string
  url_mapa: string
  costo_entrada: number
  dificultad: "baja" | "media" | "alta" | "extrema"
}

export type SaltoFormProps = {
  initialData?: {
    id_destino?: number
    nombre: string
    descripcion,
    ubicacion: string
    url_mapa: string
    costo_entrada: number
    infraestructura: string[] | undefined
    biodiversidad: string
    dificultad: 'baja' | 'media' | 'alta' | 'extrema' | undefined
  }
}