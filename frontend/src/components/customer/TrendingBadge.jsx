const LABELS = {
  DANG_HOT: '🔥 Đang hot',
  MOI_HOT: '✨ Mới hot',
  BAN_CHAY: '⚡ Bán chạy',
  HA_NHIET: '❄️ Hạ nhiệt',
  AN_MON: '🌙 Ăn mòn',
};

export default function TrendingBadge({ label }) {
  if (!label || !LABELS[label]) return null;
  return <span className={`badge badge-${label}`}>{LABELS[label]}</span>;
}
