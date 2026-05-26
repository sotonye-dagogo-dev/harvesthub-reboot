import { Card } from './Card';
import { Button } from './Button';
import { formatPlatformName } from '@/lib/services/cisCheck';

export type CrossPlatformAccountInfo = {
  platforms: string[];
  firstName: string | null;
  lastName: string | null;
  email: string;
};

export function CrossPlatformAccountPrompt({
  account,
  onSignIn,
  onContinue,
}: {
  account: CrossPlatformAccountInfo;
  onSignIn: () => void;
  onContinue: () => void;
}) {
  const displayName = [account.firstName, account.lastName].filter(Boolean).join(' ') || account.email;

  if (account.platforms.length === 0) return null;

  const platformList = account.platforms.map(formatPlatformName);
  const primary = platformList[0];
  const others = platformList.slice(1);

  let message: string;
  if (platformList.length === 1) {
    message = `An account with this email already exists on ${primary}. Sign in to link your accounts.`;
  } else if (platformList.length === 2) {
    message = `An account with this email already exists on ${primary} and ${others[0]}. Sign in to link your accounts.`;
  } else {
    const rest = others.slice(0, -1).join(', ');
    message = `An account with this email already exists on ${primary}, ${rest}, and ${others[others.length - 1]}. Sign in to link your accounts.`;
  }

  return (
    <Card className="border-2 border-ds-brand-primary/20 bg-ds-brand-primary/5 mb-4">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0 text-ds-brand-primary text-lg">!</div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ds-text-primary">
              {displayName}
            </p>
            <p className="mt-1 text-sm text-ds-text-secondary">
              {message}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="primary" onClick={onSignIn}>
                Sign In Instead
              </Button>
              <Button size="sm" variant="secondary" onClick={onContinue}>
                Continue with Signup
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
