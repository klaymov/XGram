import { useState, useCallback } from 'react';

/**
 * Renders formatted text segments from parsed MessageEntities
 */
export default function FormattedText({ segments }) {
  if (!segments || segments.length === 0) return null;

  return (
    <span>
      {segments.map((segment, i) => (
        <TextSegment key={i} segment={segment} />
      ))}
    </span>
  );
}

function TextSegment({ segment }) {
  const { text, type } = segment;

  switch (type) {
    case 'bold':
      return <strong className="font-semibold">{text}</strong>;

    case 'italic':
      return <em>{text}</em>;

    case 'code':
      return (
        <code className="px-1.5 py-0.5 rounded-md bg-surface-800 dark:bg-surface-800 text-brand-300 text-[0.85em] font-mono">
          {text}
        </code>
      );

    case 'pre':
      return (
        <pre className="my-2 p-3 rounded-xl bg-surface-900/80 border border-surface-700/50 overflow-x-auto">
          <code className="text-sm font-mono text-surface-200 whitespace-pre">{text}</code>
        </pre>
      );

    case 'url':
      return (
        <a
          href={segment.url || text}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-400 hover:text-brand-300 underline underline-offset-2 decoration-brand-400/40 hover:decoration-brand-300 transition-colors break-all"
        >
          {text}
        </a>
      );

    case 'mention':
      return (
        <a
          href={`https://t.me/${text.replace('@', '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-400 hover:text-brand-300 transition-colors"
        >
          {text}
        </a>
      );

    case 'hashtag':
      return <span className="text-brand-400 cursor-pointer hover:underline">{text}</span>;

    case 'strikethrough':
      return <del className="text-surface-400">{text}</del>;

    case 'underline':
      return <u className="underline underline-offset-2">{text}</u>;

    case 'spoiler':
      return <SpoilerText text={text} />;

    case 'custom_emoji':
      return <span className="inline-flex items-center text-lg" title={text}>{text}</span>;

    case 'blockquote':
      return (
        <blockquote className="my-2 pl-3 border-l-2 border-brand-500/40 text-surface-300 italic">
          {text}
        </blockquote>
      );

    default:
      return <span>{text}</span>;
  }
}

function SpoilerText({ text }) {
  const [revealed, setRevealed] = useState(false);

  const toggle = useCallback(() => setRevealed((r) => !r), []);

  return (
    <span
      onClick={toggle}
      className={`cursor-pointer rounded px-0.5 transition-all duration-300 ${
        revealed
          ? 'bg-transparent'
          : 'bg-surface-500 text-transparent select-none hover:bg-surface-400'
      }`}
    >
      {text}
    </span>
  );
}
