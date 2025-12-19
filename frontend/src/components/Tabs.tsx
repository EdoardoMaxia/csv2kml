type TabKey = "points" | "links";

type Props = {
  active: TabKey;
  onChange: (tab: TabKey) => void;
};

export function Tabs({ active, onChange }: Props) {
  const btnStyle = (isActive: boolean): React.CSSProperties => ({
    padding: "8px 12px",
    border: "1px solid #ddd",
    background: isActive ? "#f3f3f3" : "white",
    cursor: "pointer",
  });

  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
      <button
        type="button"
        style={btnStyle(active === "points")}
        onClick={() => onChange("points")}
      >
        Points
      </button>
      <button
        type="button"
        style={btnStyle(active === "links")}
        onClick={() => onChange("links")}
      >
        Links
      </button>
    </div>
  );
}
