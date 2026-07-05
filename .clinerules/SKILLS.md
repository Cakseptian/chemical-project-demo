# Skills Usage Rules

Before executing any task in this project, activate the relevant skill(s) below using `use_skill`. Do not skip this step — skills carry specialized design, code quality, and architecture instructions that must be applied.

## Required skills by task type

### UI / visual work (any component, page, modal, layout)
1. `ui-ux-pro-max` — Run first. Provides design system, color palette, font pairings, UX guidelines.
2. `ui-styling` — Run second for component-level implementation (shadcn/ui, Tailwind patterns, accessibility).

### New code / features / refactoring
1. `ponytail` — Run before writing any new code. Forces the laziest solution that actually works. Question whether the feature needs to exist at all (YAGNI).

### Code review / finishing a feature / pre-commit
1. `react-doctor` — Run before marking any feature done. Covers lint, accessibility, bundle size, architecture.
2. `ponytail-review` — Run alongside react-doctor to catch over-engineering (reinvented stdlib, dead abstractions, unnecessary dependencies).

### Design tokens / brand / style guide work
1. `design-system` — Run for token architecture, component specs, three-layer token (primitive → semantic → component).
2. `design` — Run for logo, brand identity, CIP, icon generation, social assets.

### Debt / audit
- `ponytail-audit` — Whole-repo over-engineering audit. Use when asked to find bloat or what to delete.
- `ponytail-debt` — Harvest all `ponytail:` comments into a debt ledger.

### Banner / social / slides
- `banner-design` — Social media banners, hero images, ads.
- `slides` — HTML presentations with Chart.js.
- `brand` — Brand voice, tone of voice, marketing copy consistency.

## Skill chaining for this project (Next.js + Tailwind)

For any UI task in this repo, the default chain is:
```
ui-ux-pro-max → ponytail → ui-styling → react-doctor
```

1. `ui-ux-pro-max` — What should it look like and how should it behave?
2. `ponytail` — What's the minimum code to achieve that?
3. `ui-styling` — What's the right Tailwind / shadcn pattern?
4. `react-doctor` — Is it clean, accessible, and not over-engineered?

## Hard rules

- Never write a new component without running `ui-ux-pro-max` first.
- Never commit a feature without running `react-doctor`.
- Never add a dependency without running `ponytail` to confirm it's necessary.
- Use `ponytail-review` whenever a PR touches more than 3 files.
