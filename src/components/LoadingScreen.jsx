import { Loader2 } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 mb-6 shadow-lg shadow-brand-500/25 animate-pulse">
          <span className="text-2xl font-bold text-white">X</span>
        </div>
        <div className="flex items-center gap-2 text-surface-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Connecting to Telegram...</span>
        </div>
      </div>
    </div>
  );
}
