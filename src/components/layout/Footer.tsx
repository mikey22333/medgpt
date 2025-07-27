import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container py-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          {/* Policy Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <Link 
              href="/terms" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link 
              href="/privacy" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link 
              href="/cancellation-refund" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancellation & Refund Policy
            </Link>
          </div>

          {/* Educational Notice */}
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span className="inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
            <span className="font-medium text-amber-600">Educational Use Only</span>
          </div>
          
          {/* Medical Disclaimer */}
          <p className="text-xs text-muted-foreground max-w-2xl">
            <strong>Medical Disclaimer:</strong> This tool is for educational purposes only. 
            It is not a substitute for professional medical advice, diagnosis, or treatment. 
            Always seek the advice of your physician or other qualified health provider with any 
            questions you may have regarding a medical condition.
          </p>

          {/* Copyright */}
          <div className="text-xs text-muted-foreground pt-2 border-t w-full text-center">
            <p>© 2025 CliniSynth. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
