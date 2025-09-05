export const TypingIndicator = () => {
  return (
    <div className="flex w-full items-start">
      <div className="mr-auto rounded-xl rounded-tl-none bg-neutral-800 px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="text-sm text-neutral-300">
            L&apos;AI sta pensando
          </span>
          <div className="ml-2 flex gap-1">
            <div className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.3s]"></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.15s]"></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-neutral-400"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
