type Props = {
  onSelectFile: (file: File | null) => void;
  loading?: boolean;
};

export function FileUpload({ onSelectFile, loading }: Props) {
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        alignItems: "center",
        marginBottom: 16,
      }}
    >
      <input
        type="file"
        accept=".csv,text/csv"
        onChange={(e) => onSelectFile(e.target.files?.[0] ?? null)}
      />
      {loading && <span>Loading preview...</span>}
    </div>
  );
}
