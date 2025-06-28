"use client";

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 p-4">
      <Card className="p-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm max-w-md w-full">
        <div className="text-center space-y-6">
          {/* Error Icon */}
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>

          {/* Error Message */}
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-gray-900">
              Authentication Error
            </h1>
            <p className="text-gray-600">
              We encountered an issue while signing you in. This could happen if:
            </p>
            <ul className="text-sm text-gray-500 text-left space-y-1">
              <li>• The authentication link has expired</li>
              <li>• The link was already used</li>
              <li>• There was a network connectivity issue</li>
              <li>• The authentication provider is temporarily unavailable</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link href="/auth/login">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Try Signing In Again
              </Button>
            </Link>
            
            <Link href="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>

          {/* Help Section */}
          <div className="text-center text-xs text-gray-500 space-y-2">
            <p>Still having trouble?</p>
            <p>
              <Link href="/support" className="text-blue-600 hover:underline">
                Contact Support
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
