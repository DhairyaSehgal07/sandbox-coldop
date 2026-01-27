import { memo, useMemo, useState, useCallback } from 'react';
import {
  BookOpen,
  Users,
  BarChart3,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { useLocation, Link } from '@tanstack/react-router';

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';

type NavigationItemWithChildren = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: Array<{ name: string; href: string }>;
};

type NavigationItemWithoutChildren = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  activePaths?: string[];
};

type NavigationItem =
  | NavigationItemWithChildren
  | NavigationItemWithoutChildren;

function hasChildren(item: NavigationItem): item is NavigationItemWithChildren {
  return 'children' in item && item.children !== undefined;
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Daybook',
    href: '/store-admin/daybook',
    icon: BookOpen,
    children: [
      { name: 'Overview', href: '/store-admin/daybook' },
      { name: 'Incoming', href: '/store-admin/incoming' },
      { name: 'Outgoing', href: '/store-admin/outgoing' },
      { name: 'Payment History', href: '/store-admin/payment-history' },
    ],
  },
  {
    name: 'People',
    href: '/store-admin/people',
    icon: Users,
    activePaths: ['/store-admin/people'],
  },
  {
    name: 'Analytics',
    href: '/store-admin/analytics',
    icon: BarChart3,
    activePaths: ['/store-admin/analytics', '/store-admin/variety-breakdown'],
  },
  {
    name: 'Settings',
    href: '/store-admin/settings',
    icon: Settings,
    activePaths: [
      '/store-admin/settings',
      '/store-admin/settings/rbac',
      '/store-admin/settings/profile',
      '/store-admin/settings/preferences',
    ],
  },
];

const SidebarHeaderContent = memo(() => {
  return (
    <SidebarHeader>
      <div className="flex items-center gap-2 px-2 py-2">
        <h1 className="text-lg font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
          Coldop
          <span className="text-[10px] ml-1 font-medium text-muted-foreground">
            BETA
          </span>
        </h1>
      </div>
    </SidebarHeader>
  );
});
SidebarHeaderContent.displayName = 'SidebarHeaderContent';

const AppSidebar = () => {
  const { pathname } = useLocation();

  // Derive daybook open state directly from pathname instead of using useEffect
  const daybookOpen = useMemo(() => {
    return (
      pathname.startsWith('/store-admin/incoming') ||
      pathname.startsWith('/store-admin/outgoing') ||
      pathname.startsWith('/store-admin/payment-history') ||
      pathname === '/store-admin/daybook'
    );
  }, [pathname]);

  // Use state for user-controlled toggling, but initialize from pathname
  const [userToggledOpen, setUserToggledOpen] = useState<boolean | null>(null);

  // Determine final open state: user toggle takes precedence, otherwise use pathname-based state
  const isOpen = userToggledOpen !== null ? userToggledOpen : daybookOpen;

  const handleOpenChange = useCallback((open: boolean) => {
    setUserToggledOpen(open);
  }, []);

  const navigationItemsWithState = useMemo(() => {
    return navigationItems.map((item) => {
      if (hasChildren(item)) {
        const isActive =
          pathname === item.href ||
          item.children.some((c) => pathname.startsWith(c.href));

        return { ...item, isActive, isOpen, setOpen: handleOpenChange };
      }

      // TypeScript now knows item is NavigationItemWithoutChildren
      const isActive =
        pathname === item.href ||
        (item.activePaths
          ? item.activePaths.some((path) => pathname.startsWith(path))
          : pathname.startsWith(item.href));

      return { ...item, isActive };
    });
  }, [pathname, isOpen, handleOpenChange]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeaderContent />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItemsWithState.map((item) => {
                const Icon = item.icon;

                if (hasChildren(item)) {
                  return (
                    <SidebarMenuItem key={item.name}>
                      <Collapsible
                        open={item.isOpen}
                        onOpenChange={item.setOpen}
                        className="group/collapsible"
                      >
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            asChild
                            isActive={item.isActive}
                            variant="coldop-variant"
                            tooltip={item.name}
                            className="flex justify-between w-full"
                            onClick={() => item.setOpen(true)}
                          >
                            <Link
                              to={item.href}
                              className="flex items-center justify-between w-full"
                            >
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <span>{item.name}</span>
                              </div>
                              <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </Link>
                          </SidebarMenuButton>
                        </CollapsibleTrigger>

                        <CollapsibleContent className="ml-6 mt-1 group-data-[collapsible=icon]:hidden">
                          {item.children.map((child) => {
                            const isChildActive = pathname === child.href;

                            return (
                              <SidebarMenuButton
                                key={child.name}
                                asChild
                                isActive={isChildActive}
                                size="sm"
                                className="pl-6"
                              >
                                <Link to={child.href}>{child.name}</Link>
                              </SidebarMenuButton>
                            );
                          })}
                        </CollapsibleContent>
                      </Collapsible>
                    </SidebarMenuItem>
                  );
                }

                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={item.isActive}
                      variant="coldop-variant"
                      tooltip={item.name}
                    >
                      <Link to={item.href}>
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default memo(AppSidebar);
