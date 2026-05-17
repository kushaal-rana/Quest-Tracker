export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse">
      <div className="h-4 w-40 rounded bg-muted" />
      <div className="mt-6 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-muted" />
        <div className="space-y-1.5">
          <div className="h-7 w-56 rounded bg-muted" />
          <div className="h-4 w-20 rounded bg-muted" />
        </div>
      </div>
      <div className="mt-4 h-4 w-96 rounded bg-muted" />
      <div className="mt-6 h-80 w-full rounded-xl bg-muted" />
    </div>
  );
}
