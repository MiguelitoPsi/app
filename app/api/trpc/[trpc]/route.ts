import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '@/lib/trpc/root'
import { createContext } from '@/lib/trpc/trpc'

const handler = async (req: Request, props: { params: Promise<any> }) => {
  await props.params
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: ({ req: innerReq }) => createContext({ headers: innerReq.headers }),
  })
}

export { handler as GET, handler as POST }
