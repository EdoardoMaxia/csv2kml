import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Props = {
  message: string;
};

export function ErrorBanner({ message }: Props) {
  if (!message) return null;

  return (
    <Alert variant="destructive" className="mt-4">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
