import * as React from "react";

interface Props {
  text: string;
  className?: string;
}

const CopyToClipboardButton: React.FC<Props> = ({ text, className = "" }) => {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy:", text);
    }
  }

  return (
    <button
      type="button"
      className={
        "btn btn-sm btn-link p-0 align-self-start " + className
      }
      title={copied ? "Copied" : "Copy to clipboard"}
      aria-label={copied ? "Copied" : "Copy to clipboard"}
      onClick={() => void copy()}
    >
      {copied ? (
        <span className="text-success small">✓</span>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
};

export default CopyToClipboardButton;
