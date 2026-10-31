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
      // target a module's barrel (index). Deep imports are architecture violations.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^@/modules/[^/]+/(?!index(\\.js|\\.ts|\\.tsx)?$)",
              message:
                "Import from the module barrel instead: @/modules/<name>. Deep imports break the modularity contract (PLAN §1).",
            },
          ],
        },
      ],
    },
  },
];
