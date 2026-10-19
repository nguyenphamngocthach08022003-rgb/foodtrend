export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i += 1) pages.push(i);

  return (
    <div className="flex items-center gap-8" style={{ justifyContent: 'center', marginTop: 32 }}>
      <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        ‹ Trước
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className="btn btn-sm"
          style={{
            background: p === page ? 'var(--color-primary)' : 'transparent',
            color: p === page ? '#fff' : 'var(--color-ink)',
            border: '1.5px solid var(--color-line)',
          }}
        >
          {p}
        </button>
      ))}
      <button className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Sau ›
      </button>
    </div>
  );
}
