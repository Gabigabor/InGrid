# InGrid

My private design system, built as a framework for future projects.

**Figma variables are the source of truth.** Every colour, size, radius and type value in code comes from the Figma file through an exported token file. Components never hard-code design values.

```
Figma variables ──(Ingrid token export plugin)──▶ packages/tokens/src/ingrid.tokens.json
                                                       │  npm run tokens
                                                       ▼
                         packages/tokens/dist/tokens.css   (CSS variables, Light + Dark)
                         packages/tokens/dist/text-styles.css
                         packages/tokens/dist/tokens.js + .d.ts
                                                       │
                                                       ▼
                         packages/react   (headless React Aria components, styled only with var(--ingrid-…))
```

## Repository layout

| Path | What it is |
| --- | --- |
| `docs/variable-taxonomy.md` | The rules for naming and changing variables in Figma. |
| `tools/figma-token-export/` | A Figma development plugin that exports every variable and text style to JSON. It works on any Figma plan (the Variables REST API is Enterprise-only). |
| `packages/tokens/` | `@ingrid/tokens`: the exported JSON and the dependency-free build that turns it into CSS and TypeScript. |
| `packages/react/` | `@ingrid/react`: React components. Behaviour and accessibility come from [React Aria Components](https://react-spectrum.adobe.com/react-aria/); the look comes only from Ingrid tokens. |
| `scripts/check-css-tokens.mjs` | Fails if component CSS uses a token that doesn't exist or a raw value (hex, px, …). |

## Updating tokens from Figma

1. One-time setup: in the Figma desktop app, go to **Plugins → Development → Import plugin from manifest…** and pick `tools/figma-token-export/manifest.json`.
2. Open the Ingrid Foundation file and run **Plugins → Development → Ingrid token export**.
3. Click **Download ingrid.tokens.json** and save it over `packages/tokens/src/ingrid.tokens.json`.
4. Run `npm run tokens`, then commit the JSON and `packages/tokens/dist/` together.

The build stops with an error if a variable has no valid WEB code syntax, if two variables share a CSS name, or if an alias points at something that no longer exists. CI rebuilds the tokens and fails if `dist/` doesn't match the committed export.

### How Figma maps to CSS

- **The CSS name is the variable's WEB code syntax in Figma**, for example `colors/primary/default` → `--ingrid-color-primary-default`. To rename a CSS variable, change its code syntax in Figma.
- **Aliases stay aliases.** A semantic token is `var()` of its primitive, so a primitive change flows through.
- **Colour + opacity values** (a colour alias mixed with an opacity alias) become `color-mix(in srgb, var(--colour) calc(var(--opacity) * 100%), transparent)`.
- **Units:** sizes are `px`, opacity is converted from Figma's 0–100 to 0–1, and font weight has no unit.
- **Modes:** Light is the default on `:root`. Dark applies with `data-theme="dark"` on `<html>` or on any element, and automatically through `prefers-color-scheme` when no theme is set.

## Using it in an app

```tsx
import '@ingrid/tokens/tokens.css';
import { Button } from '@ingrid/react';

<Button appearance="filled" variant="primary" size="medium" onPress={save}>Save</Button>
<Button appearance="outlined" variant="destructive" leadingIcon={<TrashIcon />}>Delete</Button>
<Button appearance="text" variant="inverse" isDisabled>Unavailable</Button>
```

| Prop | Values | Figma property |
| --- | --- | --- |
| `appearance` | `filled` (default), `outlined`, `text` | Appearance |
| `variant` | `primary` (default), `neutral`, `destructive`, `inverse` (for dark backgrounds) | Variant |
| `size` | `small` 24 px, `medium` 32 px (default), `large` 44 px | Size |
| `leadingIcon`, `trailingIcon` | any SVG (sized by the button) | Leading / Trailing icon |
| `isDisabled` | boolean | Disabled |

Hovered, Pressed and Focused aren't props. React Aria tracks them (`data-hovered`, `data-pressed`, `data-focus-visible`), and the CSS applies the matching state-overlay tokens. The focus ring appears only for keyboard focus. All other React Aria Button props, such as `onPress`, `type` and `aria-label`, pass through.

## Development

```sh
npm install
npm run tokens        # rebuild tokens from the Figma export
npm run lint:css      # component CSS uses only Ingrid tokens
npm run typecheck
npm run storybook     # http://localhost:6006, with a Light/Dark toolbar switch
```

CI (`.github/workflows/ci.yml`) runs all of the above, builds Storybook and uploads screenshots of every Button variant in Light and Dark.
