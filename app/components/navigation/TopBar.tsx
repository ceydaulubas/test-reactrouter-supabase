import { useNavigate, useParams } from 'react-router';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import { Bell, LogOut, Menu, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '~/services/supabase.client';
import { NavigationFooter, NavigationLinks } from './Sidebar';

interface TopBarProps {
  currentPath: string;
}

export function TopBar({ currentPath }: TopBarProps) {
  const navigate = useNavigate();
  const params = useParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch user's teams
  useEffect(() => {
    async function fetchTeams() {
      try {
        const supabase = createSupabaseBrowserClient();

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch teams where user is a member
        await supabase
          .from('team_members')
          .select(
            `
            team_id,
            role,
            teams (
              id,
              slug,
              name,
              description,
              created_at,
              updated_at,
              creator_user_id
            )
          `
          )
          .eq('user_id', user.id);
      } catch {
        // Error fetching teams
      }
    }

    fetchTeams();
  }, [params.teamSlug]);

  const handleSignOut = async () => {
    // For now, just redirect to login
    // In a real app, you'd call a server action to sign out
    navigate('/login');
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Dialog open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-4 w-4" />
              <span className="sr-only">Open navigation</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="top-0 left-0 flex h-full max-w-72 translate-x-0 translate-y-0 flex-col rounded-none p-0 sm:max-w-80">
            <DialogHeader>
              <DialogTitle className="p-6 pb-2">
                <img
                  src="/blenda_logo_horizontal.svg"
                  alt="Blenda Labs"
                  className="h-9 w-auto"
                />
              </DialogTitle>
            </DialogHeader>
            <nav className="flex-1 p-4">
              <NavigationLinks
                currentPath={currentPath}
                onNavigate={() => setIsMobileMenuOpen(false)}
              />
            </nav>
            <NavigationFooter />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          onClick={handleSignOut}
          className="gap-2 transition-all duration-200 hover:scale-105"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>
    </header>
  );
}
