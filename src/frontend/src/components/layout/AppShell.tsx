import { Outlet, Link, useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Home, PlusCircle, User, Heart } from 'lucide-react';
import LoginButton from '@/components/auth/LoginButton';
import ProfileSetupDialog from '@/components/auth/ProfileSetupDialog';

export default function AppShell() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const navigate = useNavigate();
  const isAuthenticated = !!identity;

  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src="/assets/generated/streamy-logo.dim_512x512.png" 
                alt="Streamy" 
                className="h-8 w-auto"
              />
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  Explore
                </Link>
              </Button>
              {isAuthenticated && (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/create-room">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create Room
                    </Link>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      if (identity) {
                        navigate({ to: `/profile/${identity.getPrincipal().toString()}` });
                      }
                    }}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated && userProfile && (
              <span className="hidden sm:inline-block text-sm text-muted-foreground">
                {userProfile.displayName}
              </span>
            )}
            <LoginButton />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border/40 bg-card/50 backdrop-blur">
        <div className="container py-6 px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              © {new Date().getFullYear()} Streamy. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              Built with <Heart className="h-3 w-3 text-primary fill-primary" /> using{' '}
              <a
                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </footer>

      {showProfileSetup && <ProfileSetupDialog />}
    </div>
  );
}
