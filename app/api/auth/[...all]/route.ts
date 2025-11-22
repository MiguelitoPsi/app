import { toNextJsHandler } from 'better-auth/next-js'
import { auth } from '@/lib/auth'

const handlers = toNextJsHandler(auth)

export const GET = async (req: Request, props: { params: Promise<any> }) => {
  const params = await props.params
  return handlers.GET(req, { params })
}

export const POST = async (req: Request, props: { params: Promise<any> }) => {
  const params = await props.params
  return handlers.POST(req, { params })
}
