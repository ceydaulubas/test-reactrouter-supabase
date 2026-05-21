import { Link, useParams } from 'react-router';
import { Button } from '~/components/ui/button';
import { Building2, Video } from 'lucide-react';
import packageJson from '../../../package.json';
import { useAuth } from '~/lib/auth';

interface SidebarProps {
  currentPath: string;
}

export function Sidebar({ currentPath }: SidebarProps) {
  const params = useParams();
  const teamSlug = params.teamSlug;
  const { user } = useAuth();

  const isActive = (path: string) => {
    // Remove the team slug from the current path for comparison
    const pathWithoutTeamSlug = currentPath.replace(`/${teamSlug}`, '');
    if (pathWithoutTeamSlug.startsWith(path)) return true;
    return false;
  };

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <img
          src="/blenda_logo_horizontal.svg"
          alt="Blenda Labs"
          className="h-10 w-auto mb-2"
        />
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-2">
          <Button
            variant={isActive('/templates') ? 'default' : 'ghost'}
            className="w-full justify-start gap-3"
            asChild
          >
            <Link to={`/${teamSlug}/templates`}>
              <Video className="h-4 w-4" />
              Templates
            </Link>
          </Button>
          <Button
            variant={isActive('/brands') ? 'default' : 'ghost'}
            className="w-full justify-start gap-3"
            asChild
          >
            <Link to={`/${teamSlug}/brands`}>
              <Building2 className="h-4 w-4" />
              Brands
            </Link>
          </Button>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground space-y-1">
          {user?.email && <div className="truncate">{user.email}</div>}
          <div>v{packageJson.version}</div>
        </div>
      </div>
    </aside>
  );
}
