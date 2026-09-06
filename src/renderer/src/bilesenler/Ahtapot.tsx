interface Props {
  boyut?: number
  className?: string
}

/** Ajansin marka simgesi. Tasarimdaki turuncu ahtapot. */
export default function Ahtapot({ boyut = 30, className }: Props): React.JSX.Element {
  return (
    <svg
      width={boyut}
      height={boyut}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ahtapot-govde" x1="20" y1="4" x2="20" y2="30">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>

      {/* kollar */}
      <g stroke="url(#ahtapot-govde)" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M9 24c-2.5 3-4 5-3.5 8" />
        <path d="M13.5 26.5c-1.5 3.5-2.5 6-2 8.5" />
        <path d="M20 27.5c0 3.5 0 6 .5 8.5" />
        <path d="M26.5 26.5c1.5 3.5 2.5 6 2 8.5" />
        <path d="M31 24c2.5 3 4 5 3.5 8" />
      </g>

      {/* gövde */}
      <path
        d="M20 3.5c-7.2 0-12.5 5.2-12.5 12.2 0 4.6 1.9 8 4.6 10.2 1.3 1 2.9-.2 4-.9 1.2-.8 2.5-1.3 3.9-1.3s2.7.5 3.9 1.3c1.1.7 2.7 1.9 4 .9 2.7-2.2 4.6-5.6 4.6-10.2C32.5 8.7 27.2 3.5 20 3.5Z"
        fill="url(#ahtapot-govde)"
      />

      {/* gözler */}
      <ellipse cx="15" cy="15.5" rx="3.3" ry="3.8" fill="#fff" />
      <ellipse cx="25" cy="15.5" rx="3.3" ry="3.8" fill="#fff" />
      <circle cx="15.6" cy="16.2" r="1.9" fill="#0b1120" />
      <circle cx="25.6" cy="16.2" r="1.9" fill="#0b1120" />
      <circle cx="16.3" cy="15.3" r="0.7" fill="#fff" />
      <circle cx="26.3" cy="15.3" r="0.7" fill="#fff" />
    </svg>
  )
}
