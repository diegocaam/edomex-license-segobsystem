import { getStore } from '@netlify/blobs'
import { eq, desc } from 'drizzle-orm'
import { z } from 'zod'
import { database } from '../../db/index'
import { licenses } from '../../db/schema'
import type { Config } from '@netlify/functions'
const input = z
  .object({
    name: z.string().trim().min(3).max(120),
    curp: z
      .string()
      .trim()
      .toUpperCase()
      .regex(
        /^$|^[A-Z][AEIOUX][A-Z]{2}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[HM][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9][0-9]$/,
      )
      .default(''),
    folio: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9-]{4,30}$/),
    type: z
      .enum(['A', 'B', 'C', 'D', 'E', 'BE', 'EB'])
      .transform((type) => (type === 'EB' ? 'BE' : type)),
    issued: z.iso.date(),
    expires: z.iso.date(),
    suspended: z.boolean(),
    photo: z.uuid(),
    notes: z.string().max(1000).default(''),
  })
  .refine((v) => v.expires >= v.issued, {
    message: 'La fecha de vencimiento debe ser posterior a la expedición.',
  })
function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}
function normalizeLicenseType<T extends { type: string }>(row: T): T {
  return { ...row, type: row.type === 'EB' ? 'BE' : row.type }
}
export default async (req: Request) => {
  try {
    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    const db = database()
    if (req.method === 'GET' && token) {
      if (!z.uuid().safeParse(token).success)
        return json({ error: 'Registro no encontrado.' }, 404)
      const [row] = await db
        .select()
        .from(licenses)
        .where(eq(licenses.token, token))
      if (!row) return json({ error: 'Registro no encontrado.' }, 404)
      const { notes, id, ...publicRow } = row
      return json(normalizeLicenseType(publicRow))
    }
    if (req.method === 'GET')
      return json(
        (await db.select().from(licenses).orderBy(desc(licenses.updatedAt))).map(
          normalizeLicenseType,
        ),
      )
    if (req.headers.get('origin') !== url.origin)
      return json({ error: 'Origen no permitido.' }, 403)
    if (req.method === 'POST' || req.method === 'PUT') {
      const body = await req.json()
      const parsed = input.safeParse(body)
      if (!parsed.success)
        return json(
          {
            error:
              'Revisa nombre, CURP, tipo de licencia, folio, fotografía y fechas del registro.',
          },
          400,
        )
      if (
        !(await getStore({
          name: 'driver-photos',
          consistency: 'strong',
        }).getMetadata(parsed.data.photo))
      )
        return json({ error: 'Carga una fotografía válida.' }, 400)
      if (req.method === 'PUT') {
        if (!z.uuid().safeParse(body.id).success)
          return json({ error: 'Registro inválido.' }, 400)
        const [row] = await db
          .update(licenses)
          .set({ ...parsed.data, updatedAt: new Date() })
          .where(eq(licenses.id, body.id))
          .returning()
        return row ? json(row) : json({ error: 'Registro no encontrado.' }, 404)
      }
      const [row] = await db.insert(licenses).values(parsed.data).returning()
      return json(row, 201)
    }
    return json({ error: 'Método no permitido.' }, 405)
  } catch (error) {
    if (
      (error as { code?: string }).code === '23505' ||
      (error as { cause?: { code?: string } }).cause?.code === '23505'
    )
      return json({ error: 'Este folio ya está registrado.' }, 409)
    return json(
      { error: 'No se pudo completar la operación. Intenta nuevamente.' },
      500,
    )
  }
}
export const config: Config = { path: '/api/licenses' }
