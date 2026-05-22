import { Outlet, useLocation, type MetaFunction } from 'react-router';
import { requireAuth } from '../lib/auth.server';
import { Sidebar, TopBar } from '~/components/navigation';
import { appService } from '~/services/app';

export const meta: MetaFunction = () => {
  return [{ title: appService.strings.app.title }];
};

export async function loader({ request }: { request: Request }) {
  const user = await requireAuth(request);
  return { user };
}

export default function InLayout() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <Sidebar currentPath={currentPath} />

      {/* Main Content */}
      <div className="min-w-0 flex-1 flex flex-col overflow-hidden">
        <TopBar currentPath={currentPath} />

        {/* Dynamic Content Area */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
