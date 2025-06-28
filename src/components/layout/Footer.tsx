export function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container py-4">
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span className="inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
            <span className="font-medium text-amber-600">Educational Use Only</span>
          </div>
          <p className="text-xs text-muted-foreground max-w-2xl">
            <strong>Medical Disclaimer:</strong> This tool is for educational purposes only. 
            It is not a substitute for professional medical advice, diagnosis, or treatment. 
            Always seek the advice of your physician or other qualified health provider with any 
            questions you may have regarding a medical condition.
          </p>
        </div>
      </div>
    </footer>
  );
}
