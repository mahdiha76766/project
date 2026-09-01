export type PipePair = { title: string; text: string };

export function parsePipeLines(raw: string | undefined | null): PipePair[] {
  return String(raw || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf('|');
      if (i === -1) return { title: line, text: '' };
      return { title: line.slice(0, i).trim(), text: line.slice(i + 1).trim() };
    })
    .filter((item) => item.title);
}

export function serializePipeLines(items: PipePair[]) {
  return items
    .map((item) => (item.text ? `${item.title}|${item.text}` : item.title))
    .join('\n');
}
