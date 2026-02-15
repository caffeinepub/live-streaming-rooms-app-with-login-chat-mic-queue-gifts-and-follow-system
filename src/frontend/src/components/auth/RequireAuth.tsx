import { ReactNode } from 'react';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

interface RequireAuthProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function RequireAuth({ children, fallback }: RequireAuthProps) {
  const { identity, login } = useInternetIdentity();

  if (!identity) {
    return (
      fallback || (
        <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-sm text-muted-foreground">Please log in to continue</p>
          <Button onClick={login} size="sm">
            <LogIn className="h-4 w-4 mr-2" />
            Login
          </Button>
        </div>
      )
    );
  }

  return <>{children}</>;
}
