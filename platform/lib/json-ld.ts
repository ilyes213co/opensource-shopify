/**
 * Sérialise un objet en JSON sécurisé pour injection dans une balise <script type="application/ld+json">.
 * Remplace '<' par '\\u003c', '\\u2028' et '\\u2029' pour neutraliser toute tentative
 * de fermeture prématurée de balise </script> (XSS).
 */
export function safeJsonLd(data: unknown): string {
  if (data === undefined) return "null";
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
