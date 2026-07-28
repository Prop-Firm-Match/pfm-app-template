import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';

export interface Identity {
  email: string;
}

export interface Context {
  request: Request;
  // Server-verified identity for this request (see lib/auth/verify-identity),
  // null when unauthenticated. Never trust a client-supplied header/claim
  // directly in a procedure -- this is the one place identity is trusted.
  identity: Identity | null;
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Default-deny: any procedure touching real data should use this, not
// publicProcedure, unless it's genuinely meant to be public.
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.identity) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Sign-in required.' });
  }
  return next({ ctx: { ...ctx, identity: ctx.identity } });
});
