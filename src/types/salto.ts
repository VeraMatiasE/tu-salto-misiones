export type Salto = {
  id: string
  nombre: string
  ubicacion: string
  url_map: string
  costo: number
  dificultad: "baja" | "media" | "alta" | "extrema"
}