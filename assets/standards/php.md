# PHP baseline

Use this baseline only when the repository has no approved PHP standard. Framework conventions and an existing PHP-CS-Fixer, Pint, PHP_CodeSniffer, PHPStan, or Psalm configuration take precedence.

## Required defaults

- Format new code according to the current PHP-FIG PER Coding Style. Respect an existing PSR-12 baseline until the team approves migration.
- Follow PSR-4/autoloading and the project’s namespace-to-directory convention.
- Use `declare(strict_types=1)` for new files only when compatible with the package’s established policy.
- Add parameter, return, and property types where the supported PHP version permits. Use PHPDoc for information the type system cannot express, not to duplicate obvious declarations.
- Validate external input before domain use and avoid mass assignment of untrusted arrays.
- Prefer constructor injection and explicit dependencies over service locators or hidden global state, unless the framework’s established boundary requires otherwise.
- Distinguish domain failures from infrastructure failures; preserve previous exceptions when translating them.
- Keep database changes transactional where the behavior must be atomic and avoid N+1 access patterns.
- Run the repository’s formatter, static analysis, and tests at their configured levels.

## Sources

- https://www.php-fig.org/per/coding-style/
- https://www.php-fig.org/psr/psr-4/
- https://www.php.net/manual/en/language.types.declarations.php
