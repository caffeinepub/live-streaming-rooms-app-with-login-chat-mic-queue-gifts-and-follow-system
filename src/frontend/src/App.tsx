import { RouterProvider, createRouter, createRoute, createRootRoute } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import AppShell from './components/layout/AppShell';
import ExploreRoomsPage from './pages/ExploreRoomsPage';
import RoomPage from './pages/RoomPage';
import CreateRoomPage from './pages/CreateRoomPage';
import UserProfilePage from './pages/UserProfilePage';
import ExploreGroupsPage from './pages/ExploreGroupsPage';
import CreateGroupPage from './pages/CreateGroupPage';
import GroupPage from './pages/GroupPage';

const rootRoute = createRootRoute({
  component: AppShell,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: ExploreRoomsPage,
});

const roomRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/room/$roomId',
  component: RoomPage,
});

const createRoomRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/create-room',
  component: CreateRoomPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile/$principalText',
  component: UserProfilePage,
});

const groupsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/groups',
  component: ExploreGroupsPage,
});

const createGroupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/create-group',
  component: CreateGroupPage,
});

const groupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/group/$groupId',
  component: GroupPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  roomRoute,
  createRoomRoute,
  profileRoute,
  groupsRoute,
  createGroupRoute,
  groupRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  );
}
