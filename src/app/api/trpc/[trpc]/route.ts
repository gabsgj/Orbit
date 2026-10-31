import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/shared/trpc/root";
import { createContext } from "@/shared/trpc";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
  });

export { handler as GET, handler as POST };
