# No changes without permission

This rule overrides every other instruction in this repository. Reading is allowed. Changing anything is not, until the user gives permission in the current message.

## Forbidden until the user explicitly allows that exact action

- Creating, editing, deleting, renaming, moving, or formatting a file
- Rewriting working code, or adding a second copy of code that already exists
- Installing or removing a dependency
- Running a database seed, migration, or any command that writes data
- Starting a dev server and leaving it running
- `git commit`, `git push`, `git merge`, `git rebase`, `git reset`, `git tag`, or any command that updates a remote
- Stashing, discarding, or rewriting existing work

## What counts as permission

Permission is the user naming the action and telling you to do it. **Proceed** or **Apply** approves only the plan already shown.

These are not permission: "looks good", "continue", "fix this", "done", "ship it", or approval of an earlier step.

Permission for one file or one command does not cover a second file, a cleanup, a refactor, a commit, or a push.

## What to do instead

Describe the change in chat. Wait. Do not touch the project until the user allows it.
