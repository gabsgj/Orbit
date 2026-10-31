import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ["node_modules/**", ".next/**", "prisma/migrations/**", "next-env.d.ts"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      // HIGHLY MODULAR contract (docs/PLAN.md §1): cross-module imports may ONLY
      // target a module's public surface — its barrel (index), or an explicitly
      // client-safe subpath: <module>/client is a sanctioned SECOND barrel that
      // must never import server-only code (@trpc/server, prisma). It exists so
      // browser pages can take zod schemas without dragging the router into the
      // client bundle (caught by the Gate-3 detector as a script-error).
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^@/modules/[^/]+/(?!(index|client)(\\.js|\\.ts|\\.tsx)?$)",
              message:
                "Import from the module barrel instead: @/modules/<name> (or the client-safe @/modules/<name>/client for browser-safe schemas). Deep imports break the modularity contract (PLAN §1).",
            },
          ],
        },
      ],
    },
  },
];
