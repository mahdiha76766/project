type JsonLdProps = {
  data: Record<string, unknown>;
};

/** Renders a single JSON-LD script block (use @graph inside data for multiple entities). */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
