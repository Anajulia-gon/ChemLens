interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function GraduationCapIcon({ size = 26, color = "#fff", strokeWidth = 1.5 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8.5 12 4l10 4.5-10 4.5z" />
      <path d="M6 10.6v3.9c0 1.3 2.7 2.4 6 2.4s6-1.1 6-2.4v-3.9" />
      <path d="M22 8.5v4.2" />
    </svg>
  );
}

export function ClockIcon({ size = 26, color = "#3a3a3a", strokeWidth = 1.5 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.4V12l3.1 2" />
    </svg>
  );
}

export function BookIcon({ size = 26, color = "#262626", strokeWidth = 1.6 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h12a1 1 0 0 1 1 1v16l-7-4-7 4V5a1 1 0 0 1 1-1z" />
    </svg>
  );
}

export function PlusIcon({ size = 20, color = "#fff", strokeWidth = 2.2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round">
      <line x1="12" y1="6" x2="12" y2="18" />
      <line x1="6" y1="12" x2="18" y2="12" />
    </svg>
  );
}

export function XIcon({ size = 13, color = "#5a5a5a", strokeWidth = 1.6 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <line x1="1.5" y1="1.5" x2="10.5" y2="10.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <line x1="10.5" y1="1.5" x2="1.5" y2="10.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

/** Ícone de molécula (bolinha central + 3 elipses), usado no estado vazio e nos cards. */
export function MoleculeGlyph({ size = 42, color = "#7c7c7c", strokeWidth = 1.5 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" stroke={color} strokeWidth={strokeWidth}>
      <circle cx="20" cy="20" r="2.6" fill={color} stroke="none" />
      <ellipse cx="20" cy="20" rx="17" ry="6.8" />
      <ellipse cx="20" cy="20" rx="17" ry="6.8" transform="rotate(60 20 20)" />
      <ellipse cx="20" cy="20" rx="17" ry="6.8" transform="rotate(120 20 20)" />
    </svg>
  );
}

export function UploadCloudIcon({ size = 34, color = "#5a5a5a", strokeWidth = 1.5 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15V4" />
      <path d="M8 8l4-4 4 4" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

export function CsvFileIcon({ size = 52 }: { size?: number }) {
  const h = (size * 64) / 52;
  return (
    <svg width={size} height={h} viewBox="0 0 52 64" fill="none">
      <path
        d="M6 2h28l14 14v44a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
        fill="#f4f5f7"
        stroke="#c2c2c2"
        strokeWidth="1.5"
      />
      <path d="M34 2v14h14" fill="#e2e4e8" stroke="#c2c2c2" strokeWidth="1.5" />
      <rect x="2" y="34" width="40" height="20" rx="4" fill="#1e8f5b" />
      <text x="22" y="48" fontFamily="monospace" fontSize="11" fontWeight="700" fill="#fff" textAnchor="middle">
        CSV
      </text>
    </svg>
  );
}

export function PencilIcon({ size = 18, color = "#3a3a3a", strokeWidth = 1.6 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 4l6 6-11 11H3v-6z" />
    </svg>
  );
}

export function DiagonalLineIcon({ size = 18, color = "#3a3a3a", strokeWidth = 1.6 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round">
      <line x1="4" y1="20" x2="20" y2="4" />
    </svg>
  );
}

export function ArrowRightIcon({ size = 20, color = "#fff", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

export function ArrowLeftIcon({ size = 20, color = "#3a3a3a", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

export function SearchIcon({ size = 20, color = "#8a8a8a", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" />
    </svg>
  );
}

export function FilterIcon({ size = 18, color = "#3a3a3a", strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function CheckIcon({ size = 12, color = "#fff", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <path d="M2.5 6.2 5 8.7 9.5 3.3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Spinner({ size = 22, color = "#9a9a9a" }: { size?: number; color?: string }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `2.5px solid ${color}33`,
        borderTopColor: color,
        animation: "spin 0.7s linear infinite",
      }}
    />
  );
}

export function TrashIcon({ size = 18, color = "#b2544c", strokeWidth = 1.7 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function AlertIcon({ size = 36, color = "#fff", strokeWidth = 1.6 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8.5" />
      <line x1="12" y1="8" x2="12" y2="13" />
      <circle cx="12" cy="16.2" r="0.6" fill={color} stroke="none" />
    </svg>
  );
}
