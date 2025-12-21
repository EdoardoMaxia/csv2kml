type Props = {
  headers: string[];
  rows: string[][];
};

export function CsvPreviewTable({ headers, rows }: Props) {
  return (
    <>
      <h2 style={{ marginTop: 24, marginLeft: 20, marginBottom: 10 }}>
        <b>Preview</b>
      </h2>
      <div style={{ overflowX: "auto", border: "1px solid #ddddddff" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {headers.map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: 8,
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                {headers.map((_, cidx) => (
                  <td
                    key={cidx}
                    style={{
                      padding: 8,
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    {row[cidx] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
