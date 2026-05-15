type LoadingBlockProps = {
  message: string;
};

export default function LoadingBlock({ message }: LoadingBlockProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-panel">
      <div className="flex items-center gap-3">
        <span className="h-3 w-3 animate-pulse rounded-full bg-slate-900" />
        <p className="text-sm font-medium text-slate-600">{message}</p>
      </div>
    </div>
  );
}
