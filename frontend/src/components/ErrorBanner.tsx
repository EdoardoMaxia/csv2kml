type Props = { message: string };

export function ErrorBanner({ message }: Props) {
  if (!message) return null;

  return (
    <div
      style={{
        padding: 12,
        background: "#ffecec",
        border: "1px solid #ffb3b3",
        marginBottom: 16,
      }}
    >
      <b>Error:</b> {message}
    </div>
  );
}
