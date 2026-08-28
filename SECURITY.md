# Security policy

## Reporting a vulnerability

Report privately through GitHub's
[private vulnerability reporting](https://github.com/DeharengOlivier/crible-politique/security/advisories/new)
rather than by opening a public issue. Please include what you did, what you
observed, and what you expected. A first answer is sent within seven days.

Do not run automated scanners against a deployed instance, and do not use a real
person's answers as test material: the data this project handles describes
political opinions.

## What matters most here

The tool computes everything in the browser and stores nothing about anyone. The
findings that matter most are therefore the ones that break that property:

- any path that sends a set of answers, or anything derived from them, to a
  server that keeps it;
- any way to recover someone's answers from a share link they did not intend to
  share;
- stored or reflected cross-site scripting, which would let injected code read
  the answers held in `localStorage`;
- anything that makes the published data or the score of a party depend on the
  request rather than on the files in `data/`.

## Static analysis

CodeQL runs on every push, every pull request, and weekly on a schedule, with
the `security-and-quality` query set.

One alert is dismissed, and this is the record of why. `js/log-injection` in
`scripts/privacy-check.mjs` traces the request line the logging proxy records
into the failure report the check prints. `readable()` sanitises that line
where it is stored: a line break becomes a space, every other control
character is escaped, and the line is capped. CodeQL's taint tracking does not
recognise that function as a sanitiser, so the path is still reported. The
script is also a CI-only check that drives a browser at a local build, and the
only thing writing request lines into it is the browser it launched itself.

If `readable()` is ever removed or weakened, the dismissal stops being true.

## Dependencies

`npm audit --audit-level=high` runs in CI on every push and every pull request,
and it is a blocking job. Dependabot opens weekly update pull requests.

One resolution is pinned by hand in `package.json`:

    "overrides": { "micromatch": { "picomatch": "^4.0.7" } }

`eslint-config-next` reaches `picomatch@2.3.1` through `fast-glob@3.3.1` and
`micromatch@4.0.8`. Both advisories against that version (GHSA-3v7f-55p6-f55p,
GHSA-c2c7-rcm5-vvqj) are unfixed upstream: `micromatch@4.0.8` is the latest
release and still requires `picomatch@^2.3.1`. The override was verified not to
change behaviour by comparing the exact list of files ESLint reports on before
and after: 59 files, identical. Remove the override once `micromatch` ships a
release that depends on `picomatch@^4`.
