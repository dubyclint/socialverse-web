The following guidance helps AI coding agents become productive in the SocialVerse web app repository.

Scope & high-level architecture
- Framework: Nuxt 4 (Vue 3 + Vite + Nitro). Server-side rendering (ssr: true) with Nitro server functions in `server/`.
- State: Pinia stores (look under `stores/`); composable patterns live in `composables/` and provide the canonical APIs (e.g. `use-api.ts`, `use-socket.ts`).
- Realtime: Socket.IO is used via a plugin (`plugins/socialverse-socket.client.ts`) and wrapped by `composables/use-socket.ts`.
- Auth & backend: Supabase configured in `nuxt.config.ts` and used throughout via `@nuxtjs/supabase` and `composables/use-supabase-client`/stores. Runtime secrets are in `runtimeConfig`.

Developer workflows & commands (explicit)
- Run dev server: `npm run dev` (uses `nuxt dev`).
- Build: `npm run build` (sets NODE_OPTIONS memory). For preview: `npm run preview`.
- Typecheck: `npm run typecheck` (uses `tsc --noEmit`). Lint: `npm run lint` and `npm run lint:fix`.
- Tests: `npm run test` (Vitest). UI runner: `npm run test:ui`.
- Postinstall: `nuxt prepare` is run by `postinstall` script.

Windows notes & pushing
- This project requires Node >=22 and npm >=10 (see `package.json` engines). On Windows PowerShell use the standard `npm` commands; avoid POSIX single-quoted env var syntax found in some npm scripts.
- To push changes after committing locally (PowerShell):

```powershell
git push origin main
```

When creating branches use `git switch -c <branch-name>` followed by a push with `-u` to set upstream:

```powershell
git switch -c feat/your-change
git push -u origin feat/your-change
```

Project-specific conventions & patterns
- Plugin ordering matters: plugins with numeric prefixes (e.g. `00-init-sequence.client.ts`) are relied on via `dependsOn` in other plugins — preserve names and `dependsOn` values.
- Lazy store imports: many composables import stores dynamically (e.g. `useApi.getUserStore()` uses `await import('~/stores/user')`) — follow the same pattern to avoid circular deps.
- Single global API resolver: `composables/use-api.ts` is the canonical way to resolve headers, tokens and reactive user state. Prefer it for network calls from UI components.
- Socket lifecycle: `socialverse-socket.client.ts` depends on `00-init-sequence`. Do not initialize sockets before plugin-ready events. The composable `use-socket.ts` exposes connect/disconnect and application-level helpers.
- Typescript: `tsconfig.json` extends `.nuxt/tsconfig.json` and enables strict mode. New files must type-check under strict settings.

Integration & external services
- Supabase: configured in `nuxt.config.ts` (see `supabase` key and `runtimeConfig.public.supabase*`). Look for `@nuxtjs/supabase` usage across `server/` and composables.
- Socket.IO: server endpoint referenced by `runtimeConfig.public.socketUrl`; client plugin wraps the socket and stores its instance as `$socket` on Nuxt app.
- Optional integrations: Gun, TensorFlow, sharp, web3 are in `optionalDependencies` and guarded in code — check `composables/use-gun.ts` and `use-tensorflow.ts` before changing.

Files & examples to reference when editing behavior
- `nuxt.config.ts` — environment, modules, runtime config, routeRules, and plugin list.
- `plugins/00-init-sequence.client.ts` — app initialization sequence and store hydration example.
- `plugins/socialverse-socket.client.ts` + `composables/use-socket.ts` — socket initialization and API.
- `composables/use-api.ts` — unified API headers, token retrieval, reactive profile access.
- `package.json` — scripts and engine requirements (Node >=22, npm >=10).

Editing guidelines for AI agents
- Preserve plugin `name` and `dependsOn` strings; they are part of runtime ordering.
- Use dynamic imports for stores to avoid circular dependencies (see `use-api.ts`).
- Respect runtime config keys in `nuxt.config.ts` when adding features that read secrets or public URLs.
- Add tests for any new composable or store using Vitest; tests are expected to run with `npm run test`.
- Avoid changing global `vite.build`/`nitro` settings unless necessary; document any change in git commit message.

Example snippets (how to integrate correctly)
- Use API helper to add headers:

  const { getAuthHeaders } = useApi()
  const res = await $fetch('/api/endpoint', { headers: getAuthHeaders(), method: 'POST', body })

- Join a chat using the socket composable:

  const socket = useSocket()
  socket.connect()
  socket.joinChat(chatId)

If anything in this file looks incomplete or you need a different focus (tests, infra, CI), tell me which area to expand.

Last verified: July 7, 2026 — generated from `package.json`, `nuxt.config.ts`, `plugins/`, and `composables/` in the repository.
