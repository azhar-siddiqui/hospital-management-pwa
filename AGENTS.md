<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Permission

Read the repository freely. Do not change it, commit it, or publish it unless the user allows that action in the current message.

## Git

Do not run any of these unless the user's current message explicitly asks for that action:

- `git commit` (including `--amend`)
- `git push`, including a force-push
- `git merge`, `git rebase`, `git reset`, `git tag`
- any command that updates a remote

"Done", "looks good", "ship it", "fix this", "continue", or approval of an edit is not permission to commit or push. Permission to commit is not permission to push. Permission to push is not permission to commit. Leave commits and pushes for the user unless they name the git action.

Do not stash, discard, or rewrite existing work unless the user asks for that action.

## Code changes

Do not create, edit, delete, rename, or format a project file unless the user explicitly asks for that change.

- After a plan, wait until the user says **Proceed** or **Apply** before editing.
- A request to build or fix something allows only the files that request needs.
- Do not clean up, restyle, or refactor nearby code that already works.
- Do not rewrite working logic. Describe the improvement in chat and wait.
- Do not add a file unless the user names the path, or a plan they approved names the path.
- Do not add a dependency unless the user asks.

## DRY

If the behavior already exists, call it. Do not write a second copy, and do not rewrite the original so that the new code can live beside it.

Before adding logic, search `src/lib`, `src/hooks`, `src/components`, and `src/app/actions`. Reuse the function, hook, component, schema, or server action that already does the job.

- One responsibility lives in one place. A bug fix changes that place, not each caller.
- Shared client logic belongs in one hook under `src/hooks`. Do not paste it into a second component.
- Shared validation belongs in the existing Zod schema. Do not repeat the same rule in the form and the action.
- Shared queries belong in `src/lib`. Do not open a second Prisma call path for the same read.
- UI that already exists in `src/components/ui` or `src/components` is the implementation. Do not rebuild a button, field, dialog, table, or form control.
- A near match is still a match. Extend the existing function with a parameter when that keeps one implementation. Stop and ask before a second implementation.
- Do not add a helper, wrapper, or "utils" file for code that already has a home.
- Dead duplication is a proposal, not an edit. Name the copies in chat and wait for **Proceed**.

## Industry standard

Follow the standards this repository already uses. Do not introduce a second pattern, library, or style.

- TypeScript is strict. Type the public inputs and return values. Do not silence an error with `any` or an unused suppression.
- Next.js 16 App Router: server code stays on the server. Mutations go through the existing server actions. Read `node_modules/next/dist/docs/` before writing framework code.
- Validate input with Zod. Forms use react-hook-form and the existing `Field` components, as `demo/demo-form.tsx` does.
- Data access goes through `src/lib/prisma.ts` and the existing query helpers. Check `can()` in `src/lib/permissions.ts` before a protected read or write.
- UI uses the installed shadcn components, Tailwind v4, and the surrounding spacing and type scale. Do not add a second component library.
- Formatting and lint follow Prettier and `eslint.config.mjs` (Next.js core web vitals, TypeScript, Prettier). Do not hand-format around those tools.
- Names match the file and the domain word already used nearby. Do not rename working symbols as part of another change.
- A new dependency is a last resort, and only after the user agrees. Prefer a function that is already in the repo or the lockfile.

## One step at a time

When the user runs `/step`, or asks for only the next milestone, give one step and wait. Do not write code, and do not start the next step, until they confirm.

## Application constraints

- Auth is the `hms_session` cookie in `src/lib/session.ts`. Leave it in place unless the user asks for a different auth system.
- Prisma 7 is configured in `prisma7.config.ts`. Do not add `prisma.config.ts`.
- Do not run `pnpm db:seed` to refresh permissions. Seeding overwrites the admin password.
- The user starts `pnpm run dev`. Do not leave a dev server from this session running.
- Pages stay usable on a phone down to 320px wide, with no page-level horizontal scroll.
- Do not restore a dropped hospital model, or a removed page, unless the user asks for that module.
