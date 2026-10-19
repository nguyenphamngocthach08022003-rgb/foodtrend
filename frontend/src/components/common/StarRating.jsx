export default function StarRating({ value = 0, size = 16, onChange = null }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {stars.map((s) => (
        <span
          key={s}
          onClick={() => onChange && onChange(s)}
          style={{
            fontSize: size,
            color: s <= Math.round(value) ? 'var(--color-accent)' : 'var(--color-line)',
            cursor: onChange ? 'pointer' : 'default',
          }}
        >
          ★
        </span>
      ))}
    </span>
  );
}
