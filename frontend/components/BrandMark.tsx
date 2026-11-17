/** HoursFix mark: a map pin whose head is a clock, on a slate tile. */
export function BrandMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} role="img" aria-label="HoursFix">
      <rect width="32" height="32" rx="9" fill="#1D2B3A" />
      <path d="M16 27.5c-.4 0-.8-.2-1-.5C11.2 21.7 8.5 18 8.5 13.8a7.5 7.5 0 0 1 15 0c0 4.2-2.7 7.9-6.5 13.2-.2.3-.6.5-1 .5Z" fill="#E39B2D" />
      <circle cx="16" cy="13.8" r="5" fill="#F5F3EE" />
      <path d="M16 10.8v3.3l2.2 1.4" fill="none" stroke="#1D2B3A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24.6" cy="24.6" r="3.6" fill="#4F9A6A" stroke="#1D2B3A" strokeWidth="1" />
      <path d="M23.1 24.7l1 1 1.9-2" fill="none" stroke="#FFFFFF" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
