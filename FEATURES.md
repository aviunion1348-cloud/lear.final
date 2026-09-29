# Playbook catalogue — 1,557 operations, one keystroke away

Press <kbd>Cmd</kbd>/<kbd>Ctrl</kbd> + <kbd>K</kbd> anywhere in the console.

The palette searches 1,557 generated playbooks across all 14 shipped connectors,
plus every console section. Type a connector, a verb, or an environment —
`rollback production`, `silence datadog`, `terraform drift staging`.

---

## The honest part, first

**630 of these playbooks can actually run.** They map to a real module in
`prash/actions/`. The palette badges them **RUN**.

**927 are guided procedures.** They carry a `prash …` CLI command and open the
right view, but nothing behind them executes yet. The palette badges them
**GUIDE**, and pressing Enter copies the command rather than pretending to run it.

This split is not documentation — it is enforced. `gen_playbooks.mjs` reads the
actual contents of `prash/actions/` at generation time and can only mark a
playbook executable if the module is really there.
`desktop/src/__tests__/Playbooks.test.ts` then re-checks every single entry
against that directory and fails the build on any entry that claims a capability
the backend does not have.

It would have been easy to emit 1,557 rows that all say RUN. That number would
look better and would cost you the first time you hit Enter during an incident.

---

## Coverage

| Connector | Playbooks | Executable | Guided |
| --- | ---: | ---: | ---: |
| AWS | 135 | 54 | 81 |
| Azure | 135 | 54 | 81 |
| GCP | 135 | 54 | 81 |
| Kubernetes | 135 | 54 | 81 |
| GitHub | 117 | 45 | 72 |
| GitLab | 117 | 45 | 72 |
| Vercel | 117 | 45 | 72 |
| Datadog | 108 | 60 | 48 |
| Grafana | 108 | 60 | 48 |
| PagerDuty | 108 | 60 | 48 |
| Terraform | 93 | 21 | 72 |
| Snyk | 90 | 33 | 57 |
| Gitleaks | 90 | 33 | 57 |
| Lear Core | 69 | 12 | 57 |

**By intent:** 765 investigate · 582 remediate · 210 notify
**By risk:** 924 low · 444 medium · 189 high

Every playbook is the product of connector × operation × environment
(production / staging / development) × scope (service / namespace / region /
account) — which is how one operation becomes the specific thing you actually
need at 3am, rather than a generic menu item you then have to parameterise.

---

## Safety rules baked into the generator

- **No one-click account-wide destruction.** Any `high` risk operation at
  `account` scope is refused at generation time and never reaches the catalogue.
  A test asserts the count is zero.
- **Risk stays colour-coded**, not gold. Everything else in this console went
  gold/black; risk badges kept green/amber/red, because the one thing you must
  notice before pressing Enter should not blend into the theme.
- **Every guided entry carries a real CLI line**, verified by test — a GUIDE row
  that couldn't tell you what to run would be worse than no row.

---

## Performance

`playbooks.generated.ts` is ~850 KB. It is **dynamically imported on first
palette open**, so it lands in its own chunk (825 KB raw / **38.6 KB gzipped**)
and never touches first paint. Opening the palette before the catalogue has
loaded still works — navigation commands are available immediately and the
input says so.

The result list does not animate per row. A 40-row list with per-row entrance
animation is exactly how a command palette starts feeling slow, and this is a
tool you hit dozens of times a day.

---

## Regenerating

```bash
node scripts/gen_playbooks.mjs
```

Deterministic — same inputs produce a byte-identical file, so it is safe to run
in CI and diff. As real action modules are added to `prash/actions/`, the
executable count rises on its own with no edits to the catalogue.
