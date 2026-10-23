import { getStore } from '@netlify/blobs'
import { z } from 'zod'
import { database } from '../../db/index'
import { licenses } from '../../db/schema'
import { eq } from 'drizzle-orm'
import type { Config } from '@netlify/functions'
export default async (req: Request) => {
  try {
    const store = getStore({ name: 'driver-photos', consistency: 'strong' })
    const url = new URL(req.url)
    if (req.method === 'GET') {
      const token = url.searchParams.get('token')
      if (!z.uuid().safeParse(token).success)
        return new Response('No encontrada', { status: 404 })
      const [row] = await database()
        .select({ photo: licenses.photo })
        .from(licenses)
        .where(eq(licenses.token, token!))
      if (!row) return new Response('No encontrada', { status: 404 })
      const image = await store.get(row.photo, { type: 'arrayBuffer' })
      return image
        ? new Response(image, {
            headers: {
              'Content-Type': 'image/jpeg',
              'Cache-Control': 'no-store',
              'X-Content-Type-Options': 'nosniff',
              'X-Robots-Tag': 'noindex',
            },
          })
        : new Response('No encontrada', { status: 404 })
    }
    if (req.method !== 'POST') return new Response(null, { status: 405 })
    if (req.headers.get('origin') !== url.origin)
      return new Response(null, { status: 403 })
    const bytes = new Uint8Array(await req.arrayBuffer())
    if (
      bytes.length > 2_000_000 ||
      bytes.length < 4 ||
      bytes[0] !== 255 ||
      bytes[1] !== 216 ||
      bytes[2] !== 255
    )
      return Response.json(
        { error: 'La fotografía debe ser JPEG y menor de 2 MB.' },
        { status: 400 },
      )
    const id = crypto.randomUUID()
    await store.set(id, bytes.buffer)
    return Response.json({ id }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json(
      { error: 'No se pudo cargar la fotografía.' },
      { status: 500 },
    )
  }
}
export const config: Config = { path: '/api/photos' }
