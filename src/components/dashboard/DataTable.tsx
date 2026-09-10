type Column<T> = { key: keyof T; label: string; align?: "left" | "right"; format?: (value: T[keyof T]) => string };

export default function DataTable<T extends Record<string, unknown>>({
  title,
  columns,
  rows,
}: {
  title: string;
  columns: Column<T>[];
  rows: T[];
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-sm font-medium">{title}</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              {columns.map((col) => (
                <th key={String(col.key)} className={`py-2 pr-4 font-medium ${col.align === "right" ? "text-right" : ""}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-border/60 last:border-none">
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={`py-2 pr-4 tabular-nums ${col.align === "right" ? "text-right" : ""}`}
                  >
                    {col.format ? col.format(row[col.key]) : String(row[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
