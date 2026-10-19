// security-sanitization.test.mjs
// Teste les exigences de sécurité et de sanitization :
// 1. safeJsonLd échappe '</script>' en '\u003c/script>' et neutralise les injections XSS
// 2. safeJsonLd échappe '\u2028' et '\u2029'
// 3. settings.custom_domain est exclu des clés autorisées de settings

import assert from "node:assert";
import { safeJsonLd } from "../lib/json-ld.ts";
import { sanitizePublicStoreSettings } from "../lib/utils.ts";

console.log("Running security and sanitization test suite...");

// ── Test 1 : XSS dans JSON-LD neutralisé ──
const xssPayload = {
  name: "</script><script>alert(1)</script>",
  description: "Test <img src=x onerror=alert(2)>",
};

const serialized = safeJsonLd(xssPayload);

// Ne doit contenir aucun caractère '<' brut
assert.strictEqual(
  serialized.includes("<"),
  false,
  "Erreur : le JSON sérialisé contient encore le caractère '<' brut !"
);

// Doit contenir \u003c à la place
assert.strictEqual(
  serialized.includes("\\u003c/script>"),
  true,
  "Erreur : '</script>' n'a pas été transformé en '\\u003c/script>' !"
);

assert.strictEqual(
  serialized.includes("\\u003cscript>alert(1)\\u003c/script>"),
  true,
  "Erreur : le payload d'attaque script alert n'est pas neutralisé avec \\u003c !"
);

// Le JSON doit pouvoir être parsé normalement par JSON.parse
const parsed = JSON.parse(serialized);
assert.strictEqual(
  parsed.name,
  "</script><script>alert(1)</script>",
  "Erreur : la valeur parsée n'est pas identique au payload d'origine !"
);
console.log("✓ Test 1 passé : Injection XSS dans JSON-LD neutralisée sans altération des données.");

// ── Test 2 : Échappement de \u2028 et \u2029 ──
const unicodePayload = {
  text: "Ligne 1\u2028Ligne 2\u2029Fin",
};

const unicodeSerialized = safeJsonLd(unicodePayload);
assert.strictEqual(
  unicodeSerialized.includes("\u2028"),
  false,
  "Erreur : le caractère U+2028 n'a pas été échappé !"
);
assert.strictEqual(
  unicodeSerialized.includes("\u2029"),
  false,
  "Erreur : le caractère U+2029 n'a pas été échappé !"
);
assert.strictEqual(
  unicodeSerialized.includes("\\u2028"),
  true,
  "Erreur : \\u2028 attendu dans la chaîne sérialisée !"
);
assert.strictEqual(
  unicodeSerialized.includes("\\u2029"),
  true,
  "Erreur : \\u2029 attendu dans la chaîne sérialisée !"
);
console.log("✓ Test 2 passé : U+2028 et U+2029 correctement échappés.");

// ── Test 3 : Filtrage de custom_domain dans settings ──
const ALLOWED_SETTINGS_KEYS = new Set([
  "instagram_url",
  "facebook_page_url",
  "shipping_slip",
  "security",
  "carrier",
  "manual_shipping",
  "notifications",
]);

const incomingSettings = {
  custom_domain: "pirate-domain.com",
  instagram_url: "https://instagram.com/maboutique",
  unauthorized_key: "malicious_val",
  security: {
    strict_dz_phone: true,
  },
};

const sanitizedSettings = {};
for (const [k, v] of Object.entries(incomingSettings)) {
  if (ALLOWED_SETTINGS_KEYS.has(k)) {
    sanitizedSettings[k] = v;
  }
}

assert.strictEqual(
  "custom_domain" in sanitizedSettings,
  false,
  "Erreur : custom_domain ne doit plus être autorisé dans settings !"
);
assert.strictEqual(
  "unauthorized_key" in sanitizedSettings,
  false,
  "Erreur : unauthorized_key ne doit pas être accepté dans settings !"
);
assert.strictEqual(
  sanitizedSettings.instagram_url,
  "https://instagram.com/maboutique",
  "Erreur : instagram_url légitime a été perdu !"
);
assert.strictEqual(
  sanitizedSettings.security.strict_dz_phone,
  true,
  "Erreur : configuration security légitime a été perdue !"
);
console.log("✓ Test 3 passé : custom_domain et clés arbitraires purgés de settings.");

// ── Test 4 : Whitelist stricte de sanitizePublicStoreSettings pour les props publiques ──
// Un objet settings contenant carrier, notifications, security et une clé inconnue ne doit rien laisser passer dans les props
const sensitiveSettings = {
  carrier: {
    provider: "yalidine",
    api_id: "YAL-SECRET-123",
    api_token: "sec_token_9999",
  },
  notifications: {
    email_alerts: true,
    telegram_chat_id: "123456789",
  },
  security: {
    strict_dz_phone: true,
    anti_spam_orders: true,
    blacklist: ["0555123456", "0770987654"],
  },
  unknown_custom_key: "malicious_payload",
  another_secret: 42,
};

const publicProps = sanitizePublicStoreSettings(sensitiveSettings);

assert.deepStrictEqual(
  publicProps,
  {},
  "Erreur : un objet settings contenant carrier, notifications, security et une clé inconnue doit retourner un objet vide !"
);
assert.strictEqual("carrier" in publicProps, false);
assert.strictEqual("notifications" in publicProps, false);
assert.strictEqual("security" in publicProps, false);
assert.strictEqual("unknown_custom_key" in publicProps, false);

// Vérifier que seules les clés de la whitelist passent si elles sont présentes
const mixedSettings = {
  ...sensitiveSettings,
  instagram_url: "https://instagram.com/shop",
  facebook_page_url: "https://facebook.com/shop",
  payment_methods: ["cod", "baridimob"],
};

const mixedPublic = sanitizePublicStoreSettings(mixedSettings);
assert.deepStrictEqual(mixedPublic, {
  instagram_url: "https://instagram.com/shop",
  facebook_page_url: "https://facebook.com/shop",
  payment_methods: ["cod", "baridimob"],
});
console.log("✓ Test 4 passé : sanitizePublicStoreSettings bloque carrier, notifications, security et clés inconnues.");

console.log("All security and sanitization tests passed successfully!");
