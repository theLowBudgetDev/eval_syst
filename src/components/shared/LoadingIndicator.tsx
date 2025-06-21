import React from 'react';

export function LoadingIndicator({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <h1 className="text-3xl font-bold tracking-tight font-headline text-primary animate-bounce-opacity">
        EvalTrack
      </h1>
      <p className="text-muted-foreground mt-2">{text}</p>
    </div>
  );
}
