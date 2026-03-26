export function SunnyFace({ size = 64 }: { size?: number }) {
  const r = 30;
  const cx = 50;
  const cy = 50;

  const rays = [
    [50, 6,  50, 14],
    [73, 12, 68, 19],
    [88, 31, 81, 35],
    [94, 50, 86, 50],
    [88, 69, 81, 65],
    [73, 88, 68, 81],
    [50, 94, 50, 86],
    [27, 88, 32, 81],
    [12, 69, 19, 65],
    [6,  50, 14, 50],
    [12, 31, 19, 35],
    [27, 12, 32, 19],
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Rays */}
      {rays.map(([x1, y1, x2, y2], i) => (
        <line
          key={i}
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#FACC15"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      ))}

      {/* Face circle */}
      <circle cx={cx} cy={cy} r={r} fill="#FACC15" />

      {/* Eyes */}
      <circle cx="40" cy="44" r="4" fill="#000" />
      <circle cx="60" cy="44" r="4" fill="#000" />

      {/* Eye shine */}
      <circle cx="42" cy="42" r="1.5" fill="white" />
      <circle cx="62" cy="42" r="1.5" fill="white" />

      {/* Smile */}
      <path
        d="M 37 58 Q 50 70 63 58"
        stroke="#000"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />

      {/* Rosy cheeks */}
      <circle cx="34" cy="57" r="5" fill="#f97316" fillOpacity="0.3" />
      <circle cx="66" cy="57" r="5" fill="#f97316" fillOpacity="0.3" />
    </svg>
  );
}
