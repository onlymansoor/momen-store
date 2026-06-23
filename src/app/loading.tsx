import Spinner from "@/components/ui/Spinner";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-primary">
      <div className="flex flex-col items-center gap-4">
        <Spinner size={40} />
        <p className="text-white-muted text-sm animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
