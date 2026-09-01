import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export function HomeIcon(props: IconProps) {
  return <svg {...iconProps} {...props}><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-7h6v7" /></svg>;
}

export function VehicleIcon(props: IconProps) {
  return <svg {...iconProps} {...props}><path d="m5 16-1-2 2-6h12l2 6-1 2" /><path d="M5 16h14v3H5zM8 16v1m8-1v1M7 8l1-3h8l1 3" /></svg>;
}

export function HistoryIcon(props: IconProps) {
  return <svg {...iconProps} {...props}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></svg>;
}

export function CalendarIcon(props: IconProps) {
  return <svg {...iconProps} {...props}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" /></svg>;
}

export function BellIcon(props: IconProps) {
  return <svg {...iconProps} {...props}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>;
}

export function ArrowLeftIcon(props: IconProps) {
  return <svg {...iconProps} {...props}><path d="m15 18-6-6 6-6" /></svg>;
}

export function ArrowRightIcon(props: IconProps) {
  return <svg {...iconProps} {...props}><path d="m9 18 6-6-6-6" /></svg>;
}

export function LogoutIcon(props: IconProps) {
  return <svg {...iconProps} {...props}><path d="M10 17l5-5-5-5M15 12H3" /><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" /></svg>;
}
