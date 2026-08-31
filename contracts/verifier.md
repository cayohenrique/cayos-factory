# Project verifier contract

`verify-<project>` must contain grounded `Launch`, `Doctor`, `Drive`, `Evidence`, `Cleanup`, and `Helpers` sections plus `features/README.md`. Setup must execute one mapped feature against the real runtime boundary, preserve action and resulting-state evidence after cleanup, and hash verifier files, source paths, and evidence into the capability lock. Placeholders and screenshots without observable side effects do not pass.
