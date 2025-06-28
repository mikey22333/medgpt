import { AlertCircle, Clock, Crown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface QueryLimitWarningProps {
  queriesUsed: number;
  queryLimit: number;
  timeUntilReset: string;
  isProUser: boolean;
}

export function QueryLimitWarning({ 
  queriesUsed, 
  queryLimit, 
  timeUntilReset, 
  isProUser 
}: QueryLimitWarningProps) {
  const router = useRouter();
  
  if (isProUser) {
    return null; // Pro users don't see limits
  }

  const isAtLimit = queriesUsed >= queryLimit;
  const isNearLimit = queriesUsed >= queryLimit - 1;

  if (!isNearLimit) {
    return null; // Only show when at or near limit
  }

  return (
    <Card className={`p-4 mb-4 border-l-4 ${
      isAtLimit 
        ? 'border-red-500 bg-red-50' 
        : 'border-yellow-500 bg-yellow-50'
    }`}>
      <div className="flex items-start gap-3">
        <AlertCircle className={`h-5 w-5 mt-0.5 ${
          isAtLimit ? 'text-red-600' : 'text-yellow-600'
        }`} />
        
        <div className="flex-1">
          <h3 className={`font-semibold ${
            isAtLimit ? 'text-red-900' : 'text-yellow-900'
          }`}>
            {isAtLimit 
              ? 'Daily Chat Limit Reached' 
              : 'Approaching Daily Limit'
            }
          </h3>
          
          <p className={`text-sm mt-1 ${
            isAtLimit ? 'text-red-700' : 'text-yellow-700'
          }`}>
            {isAtLimit ? (
              <>
                You've used all <strong>{queryLimit}</strong> free chats for today. 
                Your limit will reset in <strong>{timeUntilReset}</strong>.
              </>
            ) : (
              <>
                You've used <strong>{queriesUsed}</strong> of <strong>{queryLimit}</strong> free chats today. 
                Limit resets in <strong>{timeUntilReset}</strong>.
              </>
            )}
          </p>

          {isAtLimit && (
            <div className="flex items-center gap-2 mt-3">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Wait {timeUntilReset} or upgrade for unlimited chats
              </span>
            </div>
          )}

          <div className="flex gap-2 mt-3">
            <Button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2"
              size="sm"
              variant={isAtLimit ? 'default' : 'outline'}
            >
              <Crown className="h-4 w-4" />
              Upgrade to Pro
            </Button>
            
            {isAtLimit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="text-gray-600"
              >
                <Clock className="h-4 w-4 mr-2" />
                Check Reset Time
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
