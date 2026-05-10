interface BadgeProps {
  variant: "menunggu" | "disetujui" | "ditolak" | "selesai";
}

const badgeStyles: Record<BadgeProps["variant"], string> = {
  menunggu: "bg-amber-50 text-amber-700",
  disetujui: "bg-emerald-50 text-emerald-700",
  ditolak: "bg-red-50 text-red-700",
  selesai: "bg-slate-100 text-slate-800",
};

export function Badge({ variant }: BadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeStyles[variant.toLowerCase() as keyof typeof badgeStyles]}`}>
      {variant.replace(/^[a-z]/, (value) => value.toUpperCase())}
    </span>
  );
}
