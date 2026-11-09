import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "prompt-minder",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-11-09",
    compatibilityFlags: ["nodejs_compat"],
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
      // Runtime Worker secrets. Values are set with `cf secrets` / the dashboard,
      // never committed. NEXT_PUBLIC_* client values are inlined at build time.
      ADMIN_EMAILS: bindings.secret(),
      ADMIN_TOKEN_SECRET: bindings.secret(),
      CLERK_API_URL: bindings.secret(),
      CLERK_SECRET_KEY: bindings.secret(),
      DATABASE_URL: bindings.secret(),
      MODELS_DEV_CACHE_TTL_MS: bindings.secret(),
      NEXT_PUBLIC_BASE_URL: bindings.secret(),
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: bindings.secret(),
      OPENAI_COMPAT_API_KEY: bindings.secret(),
      OPENAI_COMPAT_URL: bindings.secret(),
      SUPABASE_ANON_KEY: bindings.secret(),
      SUPABASE_URL: bindings.secret(),
      ZHIPU_API_KEY: bindings.secret(),
      ZHIPUAI_API_KEY: bindings.secret(),
    },
  }),
});
