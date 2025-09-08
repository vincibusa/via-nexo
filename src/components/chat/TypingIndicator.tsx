export const TypingIndicator = () => {
  return (
    <div className="flex w-full items-start">
      <div className="to-neutral-750 mr-auto max-w-md rounded-xl rounded-tl-none border border-neutral-600/50 bg-gradient-to-r from-neutral-800 px-6 py-4 shadow-lg">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="bg-primary-400 h-3 w-3 animate-pulse rounded-full"></div>
            <span className="text-sm font-medium text-neutral-200">
              Via Nexo AI
            </span>
          </div>
          <span className="text-xs text-neutral-400">sta cercando...</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="from-primary-400 to-primary-500 h-2 w-2 animate-bounce rounded-full bg-gradient-to-r shadow-sm [animation-delay:-0.3s]"></div>
            <div className="from-primary-500 to-primary-600 h-2 w-2 animate-bounce rounded-full bg-gradient-to-r shadow-sm [animation-delay:-0.15s]"></div>
            <div className="from-primary-600 to-primary-700 h-2 w-2 animate-bounce rounded-full bg-gradient-to-r shadow-sm"></div>
          </div>
          <span className="ml-2 text-xs text-neutral-400">
            hotel, ristoranti, tour...
          </span>
        </div>

        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-neutral-700">
          <div
            className="from-primary-500 to-primary-600 h-full animate-pulse rounded-full bg-gradient-to-r"
            style={{
              animation: "progress 3s ease-in-out infinite",
            }}
          ></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          0% {
            width: 0%;
          }
          50% {
            width: 70%;
          }
          100% {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};
