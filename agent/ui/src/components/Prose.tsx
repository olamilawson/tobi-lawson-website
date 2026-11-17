// A small, safe Markdown reader for the agent's answers: paragraphs, lists,
// headings, **bold**, *italic*, `code` and http(s) links. Built from React
// elements, never from HTML strings.
import { Fragment, type ReactNode } from "react";

function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`|\[[^\]]+\]\((https?:\/\/[^)\s]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    const k = `${key}-${i++}`;
    if (t.startsWith("**")) out.push(<strong key={k}>{t.slice(2, -2)}</strong>);
    else if (t.startsWith("`")) out.push(<code key={k} className="rounded bg-muted px-1 font-mono text-[0.9em]">{t.slice(1, -1)}</code>);
    else if (t.startsWith("[")) {
      const label = t.slice(1, t.indexOf("]("));
      out.push(<a key={k} href={m[2]} target="_blank" rel="noreferrer" className="text-accent underline-offset-2 hover:underline">{label}</a>);
    } else out.push(<em key={k}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function Prose({ text, className = "" }: { text: string; className?: string }) {
  const blocks = text.replace(/\r\n/g, "\n").trim().split(/\n{2,}/);
  return (
    <div className={`flex flex-col gap-3 text-[15px] leading-relaxed text-ink ${className}`}>
      {blocks.map((block, b) => {
        const lines = block.split("\n");
        if (lines.every((l) => /^\s*[-*•]\s+/.test(l))) {
          return (
            <ul key={b} className="ml-5 list-disc space-y-1">
              {lines.map((l, i) => <li key={i}>{inline(l.replace(/^\s*[-*•]\s+/, ""), `${b}-${i}`)}</li>)}
            </ul>
          );
        }
        if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) {
          return (
            <ol key={b} className="ml-5 list-decimal space-y-1">
              {lines.map((l, i) => <li key={i}>{inline(l.replace(/^\s*\d+[.)]\s+/, ""), `${b}-${i}`)}</li>)}
            </ol>
          );
        }
        const h = /^(#{1,4})\s+(.*)$/.exec(lines[0]);
        if (h && lines.length === 1) return <p key={b} className="font-semibold">{inline(h[2], `${b}`)}</p>;
        return (
          <p key={b}>
            {lines.map((l, i) => (
              <Fragment key={i}>
                {i > 0 && <br />}
                {inline(l, `${b}-${i}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
