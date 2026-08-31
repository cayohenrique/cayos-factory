# Tailwind CSS baseline

Use this baseline only when Tailwind is detected and the repository has no approved Tailwind/design-system standard. Detect the installed major version before proposing configuration changes.

## Required defaults

- Reuse the project’s theme tokens. In Tailwind v4, prefer top-level `@theme` variables; in v3, preserve the existing `tailwind.config` ownership.
- Write complete, statically detectable class names. Do not construct class fragments dynamically.
- Start with unprefixed mobile styles and layer breakpoint variants progressively.
- Prefer standard utilities and semantic theme tokens. Use arbitrary values for genuine one-offs, not as a replacement for the design system.
- Extract a component when a repeated UI pattern has shared behavior or a stable semantic role; do not create wrappers merely to shorten one class list.
- Preserve focus, disabled, loading, error, dark-mode, and reduced-motion states when they apply.
- Use a class-merging helper only if the project already standardizes one or conflicting utilities are a demonstrated problem.
- Do not combine competing styling systems in the same component without an explicit boundary.

## Sources

- https://tailwindcss.com/docs/theme
- https://tailwindcss.com/docs/detecting-classes-in-source-files
- https://tailwindcss.com/docs/responsive-design
- https://tailwindcss.com/docs/styling-with-utility-classes
