import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import en from '../i18n/locales/en.json';
import { CATEGORIES, FITS, PRICE_BANDS, SORTS } from '../lib/products';

const SRC = join(__dirname, '..');

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return name === 'test' ? [] : files(p);
    return /\.(jsx?|tsx?)$/.test(name) && !/\.test\./.test(name) ? [p] : [];
  });
}

function lookup(key) {
  return key.split('.').reduce((node, part) => (node && typeof node === 'object' ? node[part] : undefined), en);
}

function exists(key) {
  if (lookup(key) !== undefined) return true;
  return lookup(`${key}_one`) !== undefined && lookup(`${key}_other`) !== undefined;
}

describe('en.json', () => {
  const sources = files(SRC).map((f) => [f, readFileSync(f, 'utf8')]);

  it('defines every static key passed to t()', () => {
    const missing = [];
    for (const [file, code] of sources) {
      for (const m of code.matchAll(/\bt\(\s*'([a-zA-Z0-9_.-]+)'/g)) {
        if (!exists(m[1])) missing.push(`${m[1]}  (${file.replace(SRC, 'src')})`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('defines every dynamic key family used by the UI', () => {
    const families = {
      category: CATEGORIES,
      fit: FITS,
      sort: SORTS,
      price: PRICE_BANDS.map((b) => b.key),
      origin: ['Local_Maker', 'Global_House'],
      gender: ['Women', 'Men', 'Unisex', 'Prefer_Not_to_Say'],
      region: ['EG', 'SA', 'AE', 'Other'],
      'home.step': ['one', 'two', 'three'],
      'quiz.stamp': ['like', 'dislike'],
      'dna.signal': ['strong', 'leaning', 'light'],
      'contact.topic': ['general', 'brand', 'account', 'privacy', 'bug'],
      'about.pillar': ['curated.title', 'curated.body', 'personal.title', 'personal.body', 'local.title', 'local.body', 'honest.title', 'honest.body'],
    };
    const missing = Object.entries(families).flatMap(([prefix, keys]) => keys.map((k) => `${prefix}.${k}`).filter((k) => !exists(k)));
    expect(missing).toEqual([]);
  });

  it('has complete legal documents', () => {
    for (const doc of ['privacy', 'terms']) {
      const d = en.legal[doc];
      expect(d.title).toBeTruthy();
      expect(d.sections.length).toBeGreaterThan(3);
      for (const s of d.sections) expect(s.paragraphs?.length || s.bullets?.length).toBeGreaterThan(0);
    }
  });

  it('never mentions the retired brand name', () => {
    expect(JSON.stringify(en)).not.toMatch(/deal\s*(&|and)\s*wear/i);
  });
});
