// Ingrid token export — Figma development plugin.
//
// Reads every local variable collection, mode, alias and text style in the open
// Figma file and turns them into DTCG-style JSON (packages/tokens/src/ingrid.tokens.json).
// The UI (ui.html) merges that export into the repo's current file, rebuilds dist/ and
// opens a pull request on GitHub. This file only talks to Figma.
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

  // Aliases can point at library variables (for example Inputs in the Components file
  // aliases Colors from Foundation). Load those, and their collections, up front.
  const aliasIds = (val) => (isAlias(val) ? [val.id] : isMix(val) ? [...aliasIds(val.color), ...aliasIds(val.opacity)] : []);
  const loadVariable = async (id) => {
    if (varById.has(id)) return;
    let v = await figma.variables.getVariableByIdAsync(id);
    // A library variable that isn’t loaded in this session returns null by ID. Its ID is
    // "VariableID:<key>/<node>", so load it from the library by key instead.
    const key = !v && (id.match(/^VariableID:([0-9a-f]{40})\//) || [])[1];
    if (key) {
      try { v = await figma.variables.importVariableByKeyAsync(key); } catch (_) { v = null; }
    }
    if (!v) return; // reported as a broken alias below
    varById.set(id, v);
    if (!colById.has(v.variableCollectionId)) {
      const c = await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId);
      if (c) colById.set(c.id, c);
    }
    for (const val of Object.values(v.valuesByMode)) for (const a of aliasIds(val)) await loadVariable(a);
  };
  for (const v of variables) for (const val of Object.values(v.valuesByMode)) for (const a of aliasIds(val)) await loadVariable(a);

  const mustGet = (id, where) => {
    const v = varById.get(id);
    if (!v) throw new Error(`Broken alias in ${where}: ${id}. If it points at a library variable, check that the library is enabled in this file (Assets → Libraries) and that you can open the library file.`);
    if (!colById.has(v.variableCollectionId)) throw new Error(`${where} aliases ${v.name}, whose collection can’t be read. Is its library enabled in this file?`);
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

  if (!collections.length) throw new Error('This file has no local variables. Open the Foundation or Components file.');

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
// Settings (repository, branch, paths) and the GitHub token are kept in
// figma.clientStorage: on this computer only, never in the Figma file.
const SETTINGS_KEY = 'ingrid-export-settings';
const TOKEN_KEY = 'ingrid-github-token';

const countTokens = (node) => {
  let count = 0;
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('$') || !v || typeof v !== 'object') continue;
    count += '$value' in v ? 1 : countTokens(v);
  }
  return count;
};

if (typeof __html__ !== 'undefined') {
  figma.showUI(__html__, { width: 420, height: 640, themeColors: true });

  (async () => {
    const settings = (await figma.clientStorage.getAsync(SETTINGS_KEY)) || {};
    const token = (await figma.clientStorage.getAsync(TOKEN_KEY)) || '';
    figma.ui.postMessage({ type: 'settings', settings, token, fileName: figma.root.name });
    try {
      const tokens = await buildIngridTokens();
      figma.ui.postMessage({ type: 'ready', tokens, count: countTokens(tokens) });
    } catch (err) {
      figma.ui.postMessage({ type: 'error', message: String(err && err.message ? err.message : err) });
    }
  })();

  figma.ui.onmessage = async (msg) => {
    if (!msg) return;
    if (msg.type === 'save-settings') {
      await figma.clientStorage.setAsync(SETTINGS_KEY, msg.settings);
      if (msg.token) await figma.clientStorage.setAsync(TOKEN_KEY, msg.token);
      else await figma.clientStorage.deleteAsync(TOKEN_KEY);
    } else if (msg.type === 'notify') {
      figma.notify(msg.message, { error: !!msg.error });
    } else if (msg.type === 'close') {
      figma.closePlugin();
    }
  };
}
