---
description: Review a change for wrong behaviour and for what its tests miss
---
Review ${ARGUMENTS:-the uncommitted changes of this project}.

Give the change to the `review-kit-correctness` agent and to the `review-kit-tests` agent at the same time. Each needs the same brief: what to review, and where the project's tests are run from.

When both have answered, check each finding against the code yourself before you pass it on. Report the confirmed findings first, most serious first, each with its file and line. List what you could not confirm separately. Do not change anything.
