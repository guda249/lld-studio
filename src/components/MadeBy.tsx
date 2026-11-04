import { MAKER } from "../config";

/** Small "Made by … on LinkedIn" note; renders nothing until MAKER.linkedin is set in src/config.ts. */
export default function MadeBy({ className }: { className?: string }) {
  if (!MAKER.linkedin) return null;
  return (
    <span className={"made-by" + (className ? " " + className : "")}>
      Made by {MAKER.name ? <strong>{MAKER.name}</strong> : "the maintainer"}
      {" · "}
      <a href={MAKER.linkedin} target="_blank" rel="noopener noreferrer me">
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4V21H3zM9.5 9.75h3.8v1.6h.06c.53-1 1.84-2.05 3.78-2.05 4.04 0 4.79 2.66 4.79 6.12V21h-4v-4.9c0-1.17-.02-2.68-1.63-2.68-1.64 0-1.89 1.28-1.89 2.6V21h-3.9z" /></svg>
        {" "}LinkedIn<span className="sr-only"> (opens in a new tab)</span>
      </a>
    </span>
  );
}
