import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/lib/trpc/root";
import { createContext } from "@/lib/trpc/trpc";

const handler = async (req: Request, props: { params: Promise<any> }) => {
  await props.params;

  try {
    const response = await fetchRequestHandler({
      endpoint: "/api/trpc",
      req,
      router: appRouter,
      createContext: ({ req: innerReq }) =>
        createContext({ headers: innerReq.headers }),
      onError({ error, type, path }) {
        console.error("TRPC Error:", { type, path, error });
      },
    });

    // Ensure response has correct headers
    const headers = new Headers(response.headers);
    headers.set("Content-Type", "application/json");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    console.error("TRPC Handler Error:", error);
    return new Response(
      JSON.stringify({
        error: {
          message: "Internal server error",
          code: "INTERNAL_SERVER_ERROR",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export { handler as GET, handler as POST };
