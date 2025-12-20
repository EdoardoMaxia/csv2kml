import type { GraphNodeSpec } from "../types/csv2kml";

type Props = {
  headers: string[];
  nodeA: GraphNodeSpec;
  nodeB: GraphNodeSpec;
  onChangeNodeA: (n: GraphNodeSpec) => void;
  onChangeNodeB: (n: GraphNodeSpec) => void;
};

function NodeBlock({
  title,
  headers,
  value,
  onChange,
}: {
  title: string;
  headers: string[];
  value: GraphNodeSpec;
  onChange: (n: GraphNodeSpec) => void;
}) {
  return (
    <div
      style={{
        border: "1px solid #eee",
        padding: 12,
        borderRadius: 6,
        marginBottom: 12,
      }}
    >
      <h3 style={{ margin: "0 0 8px 0" }}>{title}</h3>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}
      >
        <label>
          Name column
          <select
            value={value.name_col}
            onChange={(e) => onChange({ ...value, name_col: e.target.value })}
            style={{ width: "100%" }}
          >
            <option value="">-- select --</option>
            {headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </label>

        <label>
          Latitude column
          <select
            value={value.lat_col}
            onChange={(e) => onChange({ ...value, lat_col: e.target.value })}
            style={{ width: "100%" }}
          >
            <option value="">-- select --</option>
            {headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </label>

        <label>
          Longitude column
          <select
            value={value.lon_col}
            onChange={(e) => onChange({ ...value, lon_col: e.target.value })}
            style={{ width: "100%" }}
          >
            <option value="">-- select --</option>
            {headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

export function GraphNodesForm({
  headers,
  nodeA,
  nodeB,
  onChangeNodeA,
  onChangeNodeB,
}: Props) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ marginTop: 0 }}>Graph points</h2>
      <div style={{ color: "#777", marginBottom: 8 }}>
        Select columns for <b>Point A</b> and <b>Point B</b>. Both will be
        deduplicated.
      </div>

      <NodeBlock
        title="Point A"
        headers={headers}
        value={nodeA}
        onChange={onChangeNodeA}
      />
      <NodeBlock
        title="Point B"
        headers={headers}
        value={nodeB}
        onChange={onChangeNodeB}
      />
    </div>
  );
}
