import { Link, useParams } from 'react-router';
import { Button } from '~/components/ui/button';
import { Building2, type LucideIcon, Video } from 'lucide-react';
import packageJson from '../../../package.json';
import { useAuth } from '~/lib/auth';

interface NavigationLink {
  href: string;
  icon: LucideIcon;
  label: string;
  path: string;
}

interface SidebarProps {
  currentPath: string;
}

function getNavigationLinks(teamSlug?: string): NavigationLink[] {
  return [
    {
      href: `/${teamSlug}/templates`,
      icon: Video,
      label: 'Templates',
      path: '/templates',
    },
    {
      href: `/${teamSlug}/brands`,
      icon: Building2,
      label: 'Brands',
      path: '/brands',
    },
  ];
}

function getIsActive(currentPath: string, teamSlug: string | undefined) {
  return (path: string) => {
    const pathWithoutTeamSlug = currentPath.replace(`/${teamSlug}`, '');
    return pathWithoutTeamSlug.startsWith(path);
  };
}

export function NavigationLinks({
  currentPath,
  onNavigate,
}: SidebarProps & { onNavigate?: () => void }) {
  const params = useParams();
  const teamSlug = params.teamSlug;
  const links = getNavigationLinks(teamSlug);
  const isActive = getIsActive(currentPath, teamSlug);

  return (
    <div className="space-y-2">
      {links.map(link => {
        const Icon = link.icon;

        return (
          <Button
            key={link.path}
            variant={isActive(link.path) ? 'default' : 'ghost'}
            className="w-full justify-start gap-3"
            asChild
          >
            <Link to={link.href} onClick={onNavigate}>
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          </Button>
        );
      })}
    </div>
  );
}

export function NavigationFooter() {
  const { user } = useAuth();

  return (
    <div className="p-4 border-t border-border">
      <div className="text-xs text-muted-foreground space-y-1">
        {user?.email && <div className="truncate">{user.email}</div>}
        <div>v{packageJson.version}</div>
      </div>
    </div>
  );
}

export function Sidebar({ currentPath }: SidebarProps) {
  return (
    <aside className="hidden w-64 bg-card border-r border-border md:flex flex-col">
      <div className="p-6 border-b border-border">
        <img
          src="/blenda_logo_horizontal.svg"
          alt="Blenda Labs"
          className="h-10 w-auto mb-2"
        />
      </div>

      <nav className="flex-1 p-4">
        <NavigationLinks currentPath={currentPath} />
      </nav>

      {/* Footer */}
      <NavigationFooter />
    </aside>
  );
}
