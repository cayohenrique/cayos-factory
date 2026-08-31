# CSS baseline

Use this baseline only when the repository has no approved CSS or design-system standard. Existing tokens, component primitives, reset, and browser-support policy take precedence.

## Required defaults

- Reuse semantic custom properties for repeated design decisions. Do not duplicate brand colors, spacing, typography, radii, or shadows across components.
- Keep selector specificity low and predictable. Avoid IDs, deep descendant chains, and `!important` except at an explicitly documented override boundary.
- Use cascade layers when the project already supports them or when establishing a new stylesheet architecture; declare layer order centrally.
- Prefer component ownership and logical properties. Avoid leaking selectors into unrelated components.
- Build mobile-first layouts around content needs, not device names. Test overflow, zoom, long text, and keyboard navigation.
- Preserve visible keyboard focus and adequate contrast. Do not remove outlines without an accessible replacement.
- Respect `prefers-reduced-motion` for non-essential animation and transitions.
- Avoid broad visual rewrites in behavior-only tickets.

## Sources

- https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascading_variables/Using_custom_properties
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40layer
- https://www.w3.org/TR/WCAG22/
- https://www.w3.org/WAI/WCAG22/Techniques/css/C39
