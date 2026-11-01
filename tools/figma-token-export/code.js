// Ingrid token export — Figma development plugin.
//
// Reads every local variable collection, mode, alias and text style in the
// Ingrid Foundation file and writes one DTCG-style JSON file:
// packages/tokens/src/ingrid.tokens.json
//
// The token-building logic lives in buildIngridTokens() so it can also be run
// on its own (for example through the Figma Plugin API from a script).

async function buildIngridTokens() {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const variables = await figma.variables.getLocalVariablesAsync();
  const varById = new Map(variables.map((v) => [v.id, v]));
  const colById = new Map(collections.map((c) => [c.id, c]));

  const colKey = (name) => name.trim().toLowerCase().replace(/\s+/g, '-');
  const pathOf = (v) => [colKey(colById.get(v.variableCollectionId).name), ...v.name.split('/')];
  const refOf = (v) => `{${pathOf(v).join('.')}}`;
  const round = (n) => Math.round(n * 10000) / 10000;
  const hex = (c) => {
    const parts = [c.r, c.g, c.b];
    if (c.a !== undefined && c.a < 1) parts.push(c.a);
    return '#' + parts.map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
  };
  const TYPE = { COLOR: 'color', FLOAT: 'number', STRING: 'string', BOOLEAN: 'boolean' };

  const isAlias = (val) => val && typeof val === 'object' && val.type === 'VARIABLE_ALIAS';
  const isMix = (val) => val && typeof val === 'object' && 'color' in val && 'opacity' in val;
  const isRgb = (val) => val && typeof val === 'object' && 'r' in val;

  const mustGet = (id, where) => {
    const v = varById.get(id);
    if (!v) throw new Error(`Broken alias in ${where}: ${id}`);
    return v;
  };

  // Encode a mode value: an alias becomes "{collection.path}", a colour + opacity
  // value becomes { color, opacity } references, raw colours become hex.
  const encode = (val, where) => {
    if (isAlias(val)) return refOf(mustGet(val.id, where));
    if (isMix(val)) return { color: encode(val.color, where), opacity: encode(val.opacity, where) };
    if (isRgb(val)) return hex(val);
    return typeof val === 'number' ? round(val) : val;
  };

  // Resolve a value to a literal, following aliases into other collections.
  // A collection that has a mode with the same name uses it; otherwise its default mode.
  const resolve = (variable, modeName, depth = 0) => {
    if (depth > 20) throw new Error(`Alias loop at ${variable.name}`);
    const col = colById.get(variable.variableCollectionId);
    const mode = col.modes.find((m) => m.name === modeName) || col.modes.find((m) => m.modeId === col.defaultModeId) || col.modes[0];
    const val = variable.valuesByMode[mode.modeId];
    if (isAlias(val)) return resolve(mustGet(val.id, variable.name), modeName, depth + 1);
    if (isMix(val)) {
      const c = resolve(mustGet(val.color.id, variable.name), modeName, depth + 1);
      const o = resolve(mustGet(val.opacity.id, variable.name), modeName, depth + 1);
      return { r: c.r, g: c.g, b: c.b, a: (c.a === undefined ? 1 : c.a) * (o / 100) };
    }
    return val;
  };

  const literal = (variable, modeName) => {
    const v = resolve(variable, modeName);
    return isRgb(v) ? hex(v) : typeof v === 'number' ? round(v) : v;
  };

  const root = {
    $extensions: {
      'com.figma': {
        source: figma.root.name,
        collections: collections.map((c) => ({
          key: colKey(c.name),
          name: c.name,
          modes: c.modes.map((m) => m.name),
          defaultMode: (c.modes.find((m) => m.modeId === c.defaultModeId) || c.modes[0]).name,
        })),
        textStyles: [],
      },
    },
  };

  for (const col of collections) {
    const defaultMode = (col.modes.find((m) => m.modeId === col.defaultModeId) || col.modes[0]).name;
    for (const id of col.variableIds) {
      const v = varById.get(id);
      if (!v) continue;
      const path = pathOf(v);
      let node = root;
      for (const part of path.slice(0, -1)) {
        if (node[part] && '$value' in node[part]) throw new Error(`Token/group name clash at ${path.join('.')}`);
        node = node[part] = node[part] || {};
      }
      const leaf = path[path.length - 1];
      if (node[leaf]) throw new Error(`Duplicate or clashing token ${path.join('.')}`);

      const modes = {};
      for (const m of col.modes) modes[m.name] = encode(v.valuesByMode[m.modeId], v.name);
      const first = modes[defaultMode];
      const token = {
        $type: TYPE[v.resolvedType],
        // DTCG-valid default value: a reference or literal; colour + opacity values are resolved.
        $value: isMix(first) ? literal(v, defaultMode) : first,
      };
      if (v.description) token.$description = v.description;
      token.$extensions = {
        'com.figma': {
          collection: col.name,
          codeSyntax: { WEB: v.codeSyntax.WEB || null },
          scopes: v.scopes,
          modes,
        },
      };
      node[leaf] = token;
    }
  }

  const styles = await figma.getLocalTextStylesAsync();
  for (const s of styles) {
    const b = s.boundVariables || {};
    const ref = (k) => (b[k] && varById.get(b[k].id) ? refOf(varById.get(b[k].id)) : null);
    root.$extensions['com.figma'].textStyles.push({
      name: s.name,
      description: s.description || '',
      fontFamily: ref('fontFamily'),
      fontSize: ref('fontSize'),
      lineHeight: ref('lineHeight'),
      fontWeight: ref('fontWeight'),
      letterSpacing: ref('letterSpacing'),
    });
  }

  return root;
}

// ---- Plugin glue (not needed when buildIngridTokens() is run on its own) ----
if (typeof __html__ !== 'undefined') {
  figma.showUI(__html__, { width: 360, height: 220 });
  buildIngridTokens()
    .then((tokens) => {
      const json = JSON.stringify(tokens, null, 2) + '\n';
      let count = 0;
      const walk = (n) => { for (const [k, v] of Object.entries(n)) { if (k.startsWith('$')) continue; if (v && typeof v === 'object') { if ('$value' in v) count++; else walk(v); } } };
      walk(tokens);
      figma.ui.postMessage({ type: 'ready', json, count });
    })
    .catch((err) => figma.ui.postMessage({ type: 'error', message: String(err && err.message ? err.message : err) }));
  figma.ui.onmessage = (msg) => { if (msg && msg.type === 'close') figma.closePlugin(); };
}
