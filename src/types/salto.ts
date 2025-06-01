export type Salto = {
  id_destino?: string
  descripcion: string
  nombre: string
  ubicacion: string
  url_mapa: string
  costo_entrada: number
  infraestructura: string[] | undefined
  dificultad: 'baja' | 'media' | 'alta' | 'extrema'
  biodiversidad: string
}

export type SaltoConId = Required<Pick<Salto, 'id_destino'>> & Omit<Salto, 'id_destino'>

export type SaltoFormProps = {
  initialData?: Salto
}