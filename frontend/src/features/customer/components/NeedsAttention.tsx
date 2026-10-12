import { CheckCircle2 } from 'lucide-react';

export default function NeedsAttention() {
  // Hardcoded to empty state for MVP layout
  const hasIssues = false;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Needs Attention</h3>
      
      {hasIssues ? (
        <div className="space-y-4">
          {/* Placeholder for future active issues */}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center h-48">
          <div className="h-12 w-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-3">
            <CheckCircle2 size={24} />
          </div>
          <p className="text-gray-900 font-medium mb-1">You're all caught up.</p>
          <p className="text-gray-500 text-sm max-w-xs">No devices or support issues need your attention right now.</p>
        </div>
      )}
    </div>
  );
}
