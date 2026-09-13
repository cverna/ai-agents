# Fedora Agent

This container provides CLI tools for Fedora compose triage and package management.

## Git Commits
You must use the following git author and email, Clement Verna <cverna@tutatnota.com>
Git commits must mention Assisted-by: OpenCode

## Available Tools

| Tool | Description |
|------|-------------|
| `koji` | Koji build system CLI |
| `bodhi` | Fedora updates system CLI |
| `fedpkg` | Fedora package management |
| `glab` | GitLab CLI |
| `gitea-mcp` | Gitea MCP server |
| `github` | GitHub MCP server (remote) |
| `podman` | Container management |
| `jq` | JSON processor |
| `yq` | YAML processor |
| `git` | Version control |
| `ripgrep` | Line-oriented search tool |
| `ripwire` | Deterministic codebase maps (ranked call graph; the "ripgrep of AI context") |

## When to use

You must use the `github` MCP server to interact with GitHub
You must use the `glab` cli to interact with GitLab
You must use the gitea-mcp MCP server to interact with Gitea (forge.fedoraproject.org)

You must use rg instead of grep.

## Modifying skills

Skill files are sourced from `/opt/opencode-skills/` and copied to `~/.config/opencode/skills/` on container start. Existing files in `~/.config/opencode/skills/` are **not** overwritten by default (`cp -n`), so edits made there persist across restarts.

- **Edit** skills in `~/.config/opencode/skills/` (on the volume, survives restarts)
- **Commit** changes to git when ready
- **Rebuild** the container image and sync new image skills with `just rebuild`
  (`just all` + runs container with `SKILLS_FORCE_SYNC=1` to overwrite volume from new image)
- To manually force a sync: delete the stale file from `~/.config/opencode/skills/` and restart,
  or run the container with `SKILLS_FORCE_SYNC=1`.

## ripwire — deterministic codebase maps (on PATH as `ripwire`)
Reach for it BEFORE blind grep + whole-file reads. First call ~1s cold; after that warm, ~0.1s.
- Orient on a task: `ripwire <dir> --for="<task in words>"` — ranked, quality-annotated
  signatures. Paste symbol/file names from the issue verbatim; named mentions get anchored.
- One task: `--pack-task="<task>"`; before parallel agents: `--plan-lanes=N --task="<goal>"`, then read `lanes[].execution`.
- Have a stack trace / build error: `ripwire <dir> --from-trace=FILE` (`-` = stdin) —
  paste the error, don't paraphrase it into a query.
- Who calls X: `--callers=SYM`. "Is it safe to change X?" needs the full blast radius:
  `--impact=SYM` (transitive) plus `--uses=SYM` (every read/write/import site).
- Apply a whole-symbol edit without a whole-file Read: `--replace-symbol-body=SYM` plus `--edit-payload=FILE|-`
  (or insert-before/after); the receipt carries region, blob_sha, edit_check, tests_to_run + ONE next= — no re-read after it; `--edit-check=SYM` is for a contract question WITHOUT an edit in hand.
- Before writing a new fn/class/helper: `--exemplar="<what you're writing>"` — duplicates are born on small tasks.
- Before calling work done: `--quality-delta` (what you made worse), then `--test-gate`.
- Trust notes: counts marked counts_floor are floors, not totals; a zero means "none
  found", never "none exists".
Defaults to break (less context is measurably MORE accurate, not just cheaper — code-repair
accuracy fell 29% -> 3% as context grew 32K -> 256K tokens, LongCodeBench):
- Do NOT open a file you have not located first: rank with `--for`/`--grep`, then read what it names.
- Do NOT read a whole file to understand one symbol: `--expand=SYM` gives the body + callee sigs.
- Do NOT fan reads across several files to learn one thing: `--pack-task="<task>"` is one call.
