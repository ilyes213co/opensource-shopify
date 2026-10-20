import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// On charge slug-utils (ou on teste la logique compilée/strip-types)
const slugUtilsFile = path.resolve(__dirname, "../lib/slug-utils.ts");
const content = fs.readFileSync(slugUtilsFile, "utf-8");

// Exécuter les tests sur les cas exigés
import {
  normalizeSlug,
  isSlugReserved,
  validateSlugFormat,
  RESERVED_SLUGS,
  SLUG_PATTERN,
  checkBrandBlocklist,
  BRAND_REJECTION_MESSAGE,
} from "../lib/slug-utils.ts";

console.log("Running TypeScript/Node slug-utils test suite...");

// 0. Tests Blocklist marques
const brandTests = [
  { input: "adidas-store", expected: true },
  { input: "Adidas-Store", expected: true },
  { input: "apple", expected: true },
  { input: "apple-shop", expected: true },
  { input: "my-nike-shop", expected: true },
  { input: "shein-dz", expected: true },
  { input: "temu-algerie", expected: true },
  { input: "louis-vuitton", expected: true },
  { input: "hm", expected: true },
  { input: "hm-store", expected: true },
  { input: "novatech-store", expected: false },
  { input: "sportstyle-dz", expected: false },
  { input: "maison-guanzo", expected: false },
];

for (const bt of brandTests) {
  const res = checkBrandBlocklist(bt.input);
  assert.equal(res.isBlocked, bt.expected, `Slug '${bt.input}' bloqué attendu: ${bt.expected}`);
  if (bt.expected) {
    assert.equal(res.reason, BRAND_REJECTION_MESSAGE);
  }
}
assert.equal(isSlugReserved("adidas-store"), true, "adidas-store doit être réservé");
assert.equal(isSlugReserved("novatech-store"), false, "novatech-store ne doit pas être réservé");

// 1. "Élégance"
const s1 = normalizeSlug("Élégance");
assert.equal(s1, "elegance", "Élégance doit devenir elegance");
assert.equal(isSlugReserved(s1), false);
assert.equal(validateSlugFormat(s1).isValid, true);

// 2. "***"
const s2 = normalizeSlug("***", "boutique");
assert.ok(s2.startsWith("boutique-"), "*** doit générer boutique-XXXX");
assert.equal(s2.length, "boutique-".length + 4);
assert.equal(validateSlugFormat(s2).isValid, true);

// 3. Un nom arabe
const s3 = normalizeSlug("متجر النور", "funnel");
assert.ok(s3.startsWith("funnel-"), "Arabe doit générer funnel-XXXX");
assert.equal(s3.length, "funnel-".length + 4);
assert.equal(validateSlugFormat(s3).isValid, true);

// 4. 80 caractères
const s4 = normalizeSlug("a".repeat(80));
assert.equal(s4.length, 40, "Doit être tronqué à 40 caractères");
assert.equal(s4, "a".repeat(40));
assert.equal(validateSlugFormat(s4).isValid, true);

// 5. "Dashboard"
const s5 = normalizeSlug("Dashboard");
assert.equal(s5, "dashboard");
assert.equal(isSlugReserved(s5), true);
assert.equal(isSlugReserved("DASHBOARD"), true);

// 6. Test automatique : tous les dossiers de premier niveau de platform/app/ sont dans RESERVED_SLUGS
const appDir = path.resolve(__dirname, "../app");
const entries = fs.readdirSync(appDir, { withFileTypes: true });
const missing = [];

for (const entry of entries) {
  if (entry.isDirectory()) {
    const name = entry.name;
    if (name.startsWith("[") && name.endsWith("]")) continue;
    if (name.startsWith("(") && name.endsWith(")")) {
      const subEntries = fs.readdirSync(path.join(appDir, name), { withFileTypes: true });
      for (const sub of subEntries) {
        if (sub.isDirectory() && !RESERVED_SLUGS.has(sub.name.toLowerCase())) {
          missing.push(`${name}/${sub.name}`);
        }
      }
      continue;
    }
    if (!RESERVED_SLUGS.has(name.toLowerCase())) {
      missing.push(name);
    }
  }
}

assert.deepEqual(missing, [], `Dossiers de platform/app/ manquants dans RESERVED_SLUGS: ${missing.join(", ")}`);

console.log("All TypeScript slug-utils tests passed successfully!");
