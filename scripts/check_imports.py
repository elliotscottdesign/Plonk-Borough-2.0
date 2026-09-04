#!/usr/bin/env python3
"""Verify every named import in src/ resolves to a real export.

Stands in for `npm run build` when node isn't available. Catches the exact class
of mistake that broke the build: importing a name the target module never exports.
"""
import re, os, sys
SRC = 'src'
exports = {}          # abs path -> set of exported names
def collect(path):
    try: s = open(path, encoding='utf-8').read()
    except Exception: return set()
    names = set(re.findall(r'^export\s+(?:const|let|var|function|class|async function)\s+([A-Za-z_$][\w$]*)', s, re.M))
    for grp in re.findall(r'^export\s*\{([^}]*)\}', s, re.M):
        for part in grp.split(','):
            part = part.strip()
            if not part: continue
            names.add(part.split(' as ')[-1].strip())
    if re.search(r'^export\s+default', s, re.M): names.add('default')
    if re.search(r'^export\s*\*', s, re.M): names.add('*')
    return names

files = []
for root, _, fs in os.walk(SRC):
    for f in fs:
        if f.endswith(('.js', '.jsx')): files.append(os.path.join(root, f))
for f in files: exports[os.path.abspath(f)] = collect(f)

bad = []
imp_re = re.compile(r"import\s+(?:([A-Za-z_$][\w$]*)\s*,\s*)?(?:\{([^}]*)\})?[^'\"]*from\s*['\"](\.[^'\"]+)['\"]")
for f in files:
    s = open(f, encoding='utf-8').read()
    for m in imp_re.finditer(s):
        default_name, named, spec = m.group(1), m.group(2), m.group(3)
        if spec.endswith(('.json', '.css', '.svg', '.png', '.jpg')):
            # Assets, not modules — just confirm the file is there.
            a = os.path.normpath(os.path.join(os.path.dirname(f), spec))
            if not os.path.exists(a): bad.append(f"{f}: asset '{spec}' NOT FOUND")
            continue
        target = os.path.normpath(os.path.join(os.path.dirname(f), spec))
        cands = [target, target + '.js', target + '.jsx', os.path.join(target, 'index.js')]
        real = next((c for c in cands if os.path.abspath(c) in exports), None)
        if not real:
            bad.append(f"{f}: imports from '{spec}' — FILE NOT FOUND"); continue
        have = exports[os.path.abspath(real)]
        if '*' in have: continue
        if default_name and 'default' not in have:
            bad.append(f"{f}: default import from '{spec}' but it has no default export")
        for n in (named or '').split(','):
            n = n.strip()
            if not n: continue
            want = n.split(' as ')[0].strip()
            if want and want not in have:
                bad.append(f"{f}: imports {{{want}}} from '{spec}' — NOT EXPORTED (has: {', '.join(sorted(have))[:90]})")

# Second pass: catch project helpers that are CALLED but never imported or
# defined — a runtime crash a named-import check cannot see. This has bitten
# twice now (restoreRememberedSession, then rotaMe), so it is checked properly.
WATCH_RE = re.compile(r'\b((?:rota|bar|dj|tourn|kitchen)[A-Z]\w+|restoreRememberedSession|forgetDevice|applyTheme|applyAccessSession)\s*\(')
for f in files:
    s2 = open(f, encoding='utf-8').read()
    for name in sorted(set(WATCH_RE.findall(s2))):
        declared = re.search(
            r'(import\s*\{[^}]*\b' + name + r'\b[^}]*\}|import[^\n]*\b' + name + r'\b|(?:function|const|let|var)\s+' + name + r'\b|' + name + r'\s*[:=])', s2, re.S)
        if not declared:
            bad.append(f"{f}: calls {name}() but never imports or defines it")

if bad:
    print(f"✗ {len(bad)} broken import(s):"); [print('   ', b) for b in bad]; sys.exit(1)
print(f"✓ all imports resolve across {len(files)} files")
