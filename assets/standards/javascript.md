# JavaScript baseline

Use this baseline only when the repository has no approved JavaScript standard. Preserve the runtime, module system, formatter, and framework conventions already in use.

## Required defaults

- Use one module system per package. Prefer native ES modules for new packages when the runtime supports them; do not mix ESM and CommonJS casually.
- Default to `const`; use `let` only for rebinding. Never create implicit globals.
- Validate input at HTTP, message, CLI, storage, and third-party boundaries.
- Keep side effects at explicit edges. Separate calculation from I/O when that makes behavior independently testable.
- Await or return promises. Handle rejections at an ownership boundary and preserve the original error cause.
- Use strict equality unless coercion is an intentional, documented part of the contract.
- Prefer small named modules with cohesive ownership over generic helper dumping grounds.
- Preserve public API compatibility unless the ticket explicitly approves a contract change.
- Use the project’s formatter and linter; do not introduce a competing style tool in a feature ticket.

## Sources

- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling
