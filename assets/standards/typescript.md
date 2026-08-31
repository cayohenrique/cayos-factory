# TypeScript baseline

Use this baseline only when the repository has no approved TypeScript standard. Existing project rules and framework conventions take precedence.

## Required defaults

- Keep `strict` enabled. Do not add blanket `@ts-ignore`, `@ts-nocheck`, or unsafe casts to bypass errors.
- Model external input as `unknown`; validate and narrow it at the boundary before domain use.
- Avoid `any`. If an integration forces it, isolate it in one adapter and explain the boundary.
- Represent finite state with discriminated unions or enums already used by the project; make invalid states difficult to construct.
- Keep types near their owner. Do not create global “types” dumping grounds or duplicate transport, persistence, and domain contracts.
- Prefer explicit public return types and stable exported contracts. Let local implementation details infer naturally.
- Preserve error causes and distinguish expected domain failures from programmer or infrastructure failures.
- Await or intentionally return every promise. Do not start untracked asynchronous work in request paths.
- Keep compiler, lint, tests, and generated types in the repository’s normal validation path.

## Change rule

Do not enable stricter compiler flags as an incidental ticket change if they create broad unrelated churn. Propose that migration separately.

## Sources

- https://www.typescriptlang.org/tsconfig/#strict
- https://www.typescriptlang.org/docs/handbook/2/narrowing.html
