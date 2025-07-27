"use client";

export function Header() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="text-sm font-bold">C</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold">CliniSynth</h1>
            <p className="text-xs text-muted-foreground">AI Medical Research Assistant</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="hidden sm:flex items-center space-x-1 text-xs text-muted-foreground">
            <span className="inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            <span>Free & Open Source</span>
          </div>
        </div>
      </div>
    </header>
  );
}
