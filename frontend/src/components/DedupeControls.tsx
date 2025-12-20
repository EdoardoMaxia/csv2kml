import type { DedupeConfig } from "../types/csv2kml";

type Props = {
  value: DedupeConfig;
  onChange: (next: DedupeConfig) => void;
};

export function DedupeControls({ value, onChange }: Props) {
  return (
    <div
      style={{ marginBottom: 16, borderTop: "1px solid #eee", paddingTop: 12 }}
    >
      <h3 style={{ margin: "8px 0" }}>Dedupe</h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label>
          Mode
          <select
            value={value.mode}
            onChange={(e) =>
              onChange({
                ...value,
                mode: e.target.value as DedupeConfig["mode"],
              })
            }
            style={{ width: "100%" }}
          >
            <option value="coords">coords</option>
            <option value="name">name</option>
          </select>
        </label>

        <label>
          Precision (coords)
          <input
            type="number"
            min={0}
            max={12}
            step={1}
            value={value.precision}
            disabled={value.mode !== "coords"}
            onChange={(e) =>
              onChange({ ...value, precision: Number(e.target.value) })
            }
            style={{ width: "100%" }}
          />
        </label>
      </div>

      <div style={{ color: "#777", marginTop: 6 }}>
        <b>coords</b>: dedupe by rounded lat/lon (recommended). <b>name</b>:
        dedupe by point name.
      </div>
    </div>
  );
}
