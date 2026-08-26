"use client";

export function PrintButton({ label = "Print this page" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="ark-no-print inline-flex items-center gap-2 rounded-xl border-2 border-sand-deep bg-surface px-4 py-2 text-sm font-semibold text-ink hover:bg-paper-deep"
    >
      <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" fill="currentColor">
        <path d="M6 2h8v4H6zM4 7h12a2 2 0 0 1 2 2v5h-4v4H6v-4H2V9a2 2 0 0 1 2-2Zm4 8h4v3H8z" />
      </svg>
      {label}
    </button>
  );
}
