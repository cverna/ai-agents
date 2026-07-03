---
name: fedora-ftbfs-search
description: Search Bugzilla for existing Fedora FTBFS/FTI bugs for packages needing rebuild
license: CC BY-SA 4.0
metadata:
  author: cverna
---

# Fedora FTBFS/FTI Bug Search

Search Bugzilla for existing Fails To Build From Source (FTBFS) or Fails To Install (FTI) bugs.

**Input (required):**
- `PACKAGES`: Space-separated list of package names
- `RELEASE`: Fedora release number (e.g., 45 for rawhide/f45)

**Output:** List of existing bugs with links, or "No existing FTBFS/FTI bugs found"

---

## Package Name Resolution

Error logs show full RPM names (e.g., `python3-vcstool-0.3.0-16.fc44.noarch`).
Bugzilla uses **source package names** as components, which often differ from subpackage names.

**Step 1: Extract base name** — strip version, release, arch suffix:
- `python3-vcstool-0.3.0-16.fc44.noarch` → `vcstool`
- `python3-spyder-6.1.0-2.fc44.noarch` → `spyder`

**Step 2: Search src.fedoraproject.org to find the correct source package name:**

```bash
curl -s "https://src.fedoraproject.org/api/0/projects?namespace=rpms&pattern=*{base-name}*&short=true" | \
  jq -r '.projects[].name' | sort -u
```

**Examples:**
| RPM package | Base name | src.fp.o result | Correct component |
|-------------|-----------|-----------------|-------------------|
| `python3-vcstool-0.3.0-16.fc44.noarch` | `vcstool` | `python-vcstool`, `python-vcstools` | `python-vcstool` |
| `python3-spyder-6.1.0-2.fc44.noarch` | `spyder` | `python-pyls-spyder`, `spyder` | `spyder` |
| `python3-spyder-kernels-3.1.1-2.fc44.noarch` | `spyder-kernels` | `python-spyder-kernels` | `python-spyder-kernels` |
| `python3-astroquery-0.4.11-3.fc45.noarch` | `astroquery` | `python-astroquery` | `python-astroquery` |
| `python3-ginga-5.5.1-2.fc44.noarch` | `ginga` | `ginga` | `ginga` |

**Pick the best match:** prefer the result that most closely matches the RPM subpackage name.

---

## Bugzilla API

| Parameter | Value |
|-----------|-------|
| Base URL | `https://bugzilla.redhat.com/rest/bug` |
| Product | `Fedora` |
| Status | `NEW`, `ASSIGNED`, `MODIFIED` (open bugs only) |

---

## Search Strategy

Search by **component** (exact match, using resolved source package name) and filter for relevant keywords.

**Keywords to match:** `FTBFS`, `FailsToInstall`, `fails to build`, `Python`

---

## Commands

```bash
# Step 1: Resolve source package name
curl -s "https://src.fedoraproject.org/api/0/projects?namespace=rpms&pattern=*{base-name}*&short=true" | \
  jq -r '.projects[].name' | sort -u

# Step 2: Search Bugzilla by resolved component name
curl -s "https://bugzilla.redhat.com/rest/bug?product=Fedora&component={source-package}&status=NEW&status=ASSIGNED&status=MODIFIED" | \
  jq '.bugs[] | select(.summary | test("FTBFS|FailsToInstall|fails to build|Python"; "i")) | {id, summary, status}'
```

**Note:** The `; "i"` flag makes the regex case-insensitive.

---

## Output Format

```markdown
### Related Bugs

| Bug ID | Summary | Status |
|--------|---------|--------|
| [#2485978](https://bugzilla.redhat.com/2485978) | F45FailsToInstall: python3-vcstool | NEW |
| [#2434943](https://bugzilla.redhat.com/2434943) | pychess: FTBFS in Fedora rawhide/f44 | NEW |
| [#2460120](https://bugzilla.redhat.com/2460120) | python-astroquery fails to build with Python 3.15 | ASSIGNED |
```

If no bugs found:
```markdown
### Related Bugs

No existing FTBFS/FTI bugs found for: python3-newpackage, python3-another
```

---

## Execution Rules

1. For each package, extract the base name (strip `python3-` prefix and version/release/arch suffix)
2. Use src.fedoraproject.org to resolve the correct source package / Bugzilla component name
3. Search Bugzilla by resolved component name, filter for FTBFS/FTI/Python keywords
4. Deduplicate results by bug ID
5. Only show open bugs (NEW, ASSIGNED, MODIFIED status)
6. Format as table with clickable bug links
7. If no bugs found for any package, list those packages
