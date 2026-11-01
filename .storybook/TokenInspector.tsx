// "Tokens" panel shown under a story: which Ingrid tokens the rendered component is using
// right now, for the current props, interaction state and colour mode.
//
// The browser only exposes final values (#7fbd00), so the token names come from the CSS rules
// themselves: we find every rule that matches the element, pick the winning declaration the way
// the cascade does (specificity, then source order) and read the var(--ingrid-…) it points to.
import React, { useLayoutEffect, useRef, useState } from 'react';
import type { Decorator } from '@storybook/react';
import { aliasChain, shortValue, type Theme } from './tokens-css';

type Declaration = { prop: string; value: string; selector: string; specificity: number; order: number };

type Row = {
  label: string;
  prop: string;
  tokens: string[];
  value: string; // as written in the winning rule
  resolved: string;
  selector: string;
  group: string;
  active?: boolean;
};

const GROUPS = ['Colour', 'States', 'Size & spacing', 'Typography'];
const STATE_PROPS: Record<string, string> = {
  '--_hover': 'data-hovered',
  '--_pressed': 'data-pressed',
  '--_focus': 'data-focus-visible',
};
const LABELS: Record<string, string> = {
  '--_bg': 'Background',
  '--_border': 'Border',
  '--_label': 'Label colour',
  '--_hover': 'Hover overlay',
  '--_pressed': 'Pressed overlay',
  '--_focus': 'Focus overlay',
  '--_padding-x': 'Horizontal padding',
  outline: 'Focus ring',
  'outline-offset': 'Focus ring offset',
  'box-shadow': 'Border width',
};

const label = (prop: string) =>
  LABELS[prop] ?? prop.replace(/^--_/, '').replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());

/** (ids, classes/attributes/pseudo-classes, types) packed into one comparable number. */
function specificity(selector: string) {
  const s = selector.replace(/::[\w-]+/g, '');
  const ids = (s.match(/#[\w-]+/g) ?? []).length;
  const classes = (s.match(/\.[\w-]+|\[[^\]]*\]|:[\w-]+/g) ?? []).length;
  const types = (s.replace(/\[[^\]]*\]/g, '').match(/(^|[\s>+~(])[a-z][\w-]*/gi) ?? []).length;
  return ids * 1e6 + classes * 1e3 + types;
}

function matchesSelector(el: Element, selector: string) {
  try {
    return el.matches(selector);
  } catch {
    return false; // pseudo-elements and selectors the browser can't test
  }
}

function winningDeclarations(el: Element) {
  const winners = new Map<string, Declaration>();
  let order = 0;

  const visit = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule) {
        order++;
        const matching = rule.selectorText.split(',').map((s) => s.trim()).filter((s) => matchesSelector(el, s));
        if (!matching.length) continue;
        const spec = Math.max(...matching.map(specificity));
        for (const [, prop, raw] of rule.style.cssText.matchAll(/([\w-]+)\s*:\s*([^;]+)/g)) {
          const value = raw.replace(/\s*!important\s*$/, '').trim();
          if (!prop.startsWith('--_') && !value.includes('var(--ingrid-')) continue;
          const current = winners.get(prop);
          if (!current || spec > current.specificity || (spec === current.specificity && order >= current.order)) {
            winners.set(prop, { prop, value, selector: matching.join(', '), specificity: spec, order });
          }
        }
      } else if (rule instanceof CSSMediaRule) {
        if (window.matchMedia(rule.conditionText).matches) visit(rule.cssRules);
      } else if (rule instanceof CSSSupportsRule) {
        visit(rule.cssRules);
      }
    }
  };

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      visit(sheet.cssRules);
    } catch {
      // cross-origin stylesheet: not readable, and not ours
    }
  }
  return winners;
}

const isColour = (v: string) => !!v && !/^-?[\d.]+(px)?$/.test(v) && CSS.supports('color', v);

function inspect(el: Element): Row[] {
  const style = getComputedStyle(el);
  const rows: Row[] = [];
  for (const d of winningDeclarations(el).values()) {
    const tokens = [...d.value.matchAll(/var\((--ingrid-[\w-]+)\)/g)].map((m) => m[1]);
    const resolved = d.prop.startsWith('--_')
      ? style.getPropertyValue(d.prop).trim()
      : tokens.length === 1
        ? style.getPropertyValue(tokens[0]).trim()
        : style.getPropertyValue(d.prop).trim();
    const group = d.prop in STATE_PROPS
      ? 'States'
      : /font|line-height|letter/.test(d.prop)
        ? 'Typography'
        : isColour(resolved) || d.prop === 'outline'
          ? 'Colour'
          : 'Size & spacing';
    rows.push({
      label: label(d.prop),
      prop: d.prop,
      tokens,
      value: d.value,
      resolved,
      selector: d.selector,
      group,
      active: d.prop in STATE_PROPS ? el.hasAttribute(STATE_PROPS[d.prop]) : undefined,
    });
  }
  return rows;
}

function stateOf(el: Element) {
  const states = ['disabled', 'pressed', 'hovered', 'focus-visible'].filter((s) => el.hasAttribute(`data-${s}`));
  return states.length ? states.join(' + ') : 'default';
}

const text = {
  default: 'var(--ingrid-color-surface-on-surface-default)',
  subtle: 'var(--ingrid-color-surface-on-surface-subtle)',
};
const rule = 'color-mix(in srgb, currentColor 15%, transparent)';
const checker = 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 10px 10px';
const mono: React.CSSProperties = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12 };

function Swatch({ value }: { value: string }) {
  return (
    <div style={{ width: 28, height: 28, borderRadius: 6, background: checker, overflow: 'hidden' }}>
      <div style={{ width: '100%', height: '100%', background: value, boxShadow: `inset 0 0 0 1px ${rule}` }} />
    </div>
  );
}

function Panel({ rows, state, theme }: { rows: Row[]; state: string; theme: Theme }) {
  const [copied, setCopied] = useState('');
  const copy = (s: string) => {
    navigator.clipboard?.writeText(s).catch(() => {});
    setCopied(s);
    setTimeout(() => setCopied((c) => (c === s ? '' : c)), 1200);
  };
  const cell: React.CSSProperties = { padding: '6px 10px', borderTop: `1px solid ${rule}`, verticalAlign: 'middle' };
  const head: React.CSSProperties = { ...cell, borderTop: 'none', textAlign: 'left', fontWeight: 600, fontSize: 12, color: text.subtle };

  return (
    <section style={{ marginTop: 32, color: text.default, fontFamily: 'system-ui, sans-serif', fontSize: 13 }}>
      <h3 style={{ margin: '0 0 4px', fontSize: 15 }}>Tokens</h3>
      <p style={{ margin: '0 0 12px', color: text.subtle, fontSize: 12 }}>
        State: <b>{state}</b> · Mode: <b>{theme}</b>. Updates as you change Controls, hover, press or tab to the
        component. Click a token to copy it.
      </p>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ ...head, width: 40 }} />
            <th style={head}>Property</th>
            <th style={head}>Token</th>
            <th style={head}>Points to ({theme})</th>
            <th style={head}>Value</th>
          </tr>
        </thead>
        {GROUPS.map((group) => {
          const groupRows = rows.filter((r) => r.group === group);
          if (!groupRows.length) return null;
          return (
            <tbody key={group}>
              <tr>
                <td colSpan={5} style={{ ...cell, fontWeight: 600, paddingTop: 16, borderTop: 'none' }}>{group}</td>
              </tr>
              {groupRows.map((r) => (
                <tr key={r.prop} title={`Set by: ${r.selector}`} style={{ opacity: r.active === false ? 0.55 : 1 }}>
                  <td style={cell}>{isColour(r.resolved) && <Swatch value={r.resolved} />}</td>
                  <td style={cell}>
                    {r.label}
                    {r.active && (
                      <span style={{ marginLeft: 6, fontSize: 11, padding: '1px 6px', borderRadius: 999, background: 'var(--ingrid-color-primary-default)', color: 'var(--ingrid-color-white)' }}>
                        active
                      </span>
                    )}
                  </td>
                  <td style={{ ...cell, ...mono }}>
                    {r.tokens.length ? (
                      r.tokens.map((t) => (
                        <button
                          key={t}
                          onClick={() => copy(`var(${t})`)}
                          style={{ all: 'unset', ...mono, cursor: 'pointer', display: 'block' }}
                        >
                          {copied === `var(${t})` ? 'Copied!' : t}
                        </button>
                      ))
                    ) : (
                      <span style={{ color: text.subtle }}>{r.value} (no token)</span>
                    )}
                  </td>
                  <td style={{ ...cell, ...mono, color: text.subtle }}>
                    {r.tokens.map((t) => {
                      const chain = aliasChain(t, theme);
                      return <div key={t}>{chain.length ? chain.map((c) => shortValue(`var(${c})`)).join(' → ') : '—'}</div>;
                    })}
                  </td>
                  <td style={{ ...cell, ...mono }}>{r.resolved}</td>
                </tr>
              ))}
            </tbody>
          );
        })}
      </table>
    </section>
  );
}

function Inspector({ selector, theme, children }: { selector: string; theme: Theme; children: React.ReactNode }) {
  const storyRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<{ rows: Row[]; state: string } | null>(null);

  useLayoutEffect(() => {
    const root = storyRef.current;
    if (!root) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = root.querySelector(selector);
        setData(el ? { rows: inspect(el), state: stateOf(el) } : null);
      });
    };
    update();
    // Props, hover/press/focus and disabled all show up as attribute changes on the element.
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, childList: true, subtree: true });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [selector, theme]);

  return (
    <>
      <div ref={storyRef}>{children}</div>
      {data && <Panel rows={data.rows} state={data.state} theme={theme} />}
    </>
  );
}

/**
 * Adds the Tokens panel under every story of a component.
 * Turn it off for one story with `parameters: { tokenInspector: { disable: true } }`.
 */
export const withTokenInspector =
  (selector: string): Decorator =>
  (Story, context) => {
    if (context.parameters.tokenInspector?.disable) return <Story />;
    const theme: Theme = context.globals.theme === 'dark' ? 'dark' : 'light';
    return (
      <Inspector selector={selector} theme={theme}>
        <Story />
      </Inspector>
    );
  };
