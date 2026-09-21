/**
 * Renders a schema.org JSON-LD block. Server component, so structured data is
 * in the raw HTML: AI crawlers (GPTBot, ClaudeBot, PerplexityBot) do not
 * execute JavaScript, and client-rendered schema is invisible to them.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is escaped data, not arbitrary HTML.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
