/**
 * modules/portal — CLIENT-SAFE barrel (PLAN §1 rule 1).
 * Browser pages import from here. NEVER import server-only code
 * (@trpc/server, prisma, service) into this file.
 */
export * from "./components";
