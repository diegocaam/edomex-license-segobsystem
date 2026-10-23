export type License = {
  id: string
  token: string
  name: string
  curp: string
  folio: string
  type: string
  issued: string
  expires: string
  suspended: boolean
  photo: string
  notes?: string
  updatedAt: string
}
export const licenseTypes = {
  A: 'Automovilista',
  B: 'Chofer',
  C: 'Motociclista',
  D: 'Servicio particular',
  E: 'Servicio especializado',
  BE: 'CARGA GENERAL Y RESIDUOS PELIGROSOS',
} as const

export function licenseDescription(type: string) {
  return licenseTypes[type as keyof typeof licenseTypes] || 'Sin descripción'
}

export const today = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
export function status(l: License) {
  const t = today()
  return l.suspended
    ? 'Suspendida'
    : l.expires < t
      ? 'Vencida'
      : l.issued > t
        ? 'Por iniciar'
        : 'Vigente'
}
export function dateLabel(s: string) {
  return new Date(s + 'T12:00:00').toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
