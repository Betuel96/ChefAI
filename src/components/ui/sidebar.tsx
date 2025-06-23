'use client';

import * as React from 'react';
import { ChevronLeft, Menu } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SidebarContextProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isMobile: boolean;
}

const SidebarContext = React.createContext<SidebarContextProps | undefined>(
  undefined
);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = React.useState(!isMobile);

  React.useEffect(() => {
    setIsOpen(!isMobile);
  }, [isMobile]);

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, isMobile }}>
      <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
    </SidebarContext.Provider>
  );
}

const Root = React.forwardRef<
  HTMLElement,
  React.ComponentProps<'aside'>
>(({ className, ...props }, ref) => {
  const { isOpen } = useSidebar();
  return (
    <aside
      ref={ref}
      className={cn(
        'fixed left-0 top-0 z-50 flex h-screen flex-col border-r bg-background transition-all duration-300 ease-in-out',
        isOpen ? 'w-64' : 'w-16',
        className
      )}
      {...props}
    />
  );
});
Root.displayName = 'Sidebar';
export const Sidebar = Root;

export const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { isOpen } = useSidebar();
  return (
    <div
      ref={ref}
      className={cn(
        'flex h-16 items-center border-b px-4',
        isOpen ? 'justify-between' : 'justify-center',
        className
      )}
      {...props}
    />
  );
});
SidebarHeader.displayName = 'SidebarHeader';

export const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('flex flex-1 flex-col overflow-y-auto', className)}
      {...props}
    />
  );
});
SidebarContent.displayName = 'SidebarContent';

export const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => {
  return (
    <ul
      ref={ref}
      className={cn('flex flex-col gap-2 p-4', className)}
      {...props}
    />
  );
});
SidebarMenu.displayName = 'SidebarMenu';

export const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => {
  return <li ref={ref} className={cn('', className)} {...props} />;
});
SidebarMenuItem.displayName = 'SidebarMenuItem';

interface SidebarMenuButtonProps
  extends React.ComponentProps<typeof Button> {
  isActive?: boolean;
  tooltip?: string;
}

export const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  SidebarMenuButtonProps
>(({ className, isActive, tooltip, children, ...props }, ref) => {
  const { isOpen } = useSidebar();
  const [icon, label] = React.Children.toArray(children);

  if (!isOpen) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            ref={ref}
            variant={isActive ? 'secondary' : 'ghost'}
            className={cn('h-12 w-12 justify-center', className)}
            {...props}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" align="center">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button
      ref={ref}
      variant={isActive ? 'secondary' : 'ghost'}
      className={cn('h-12 w-full justify-start gap-3 px-4', className)}
      {...props}
    >
      {icon}
      {label}
    </Button>
  );
});
SidebarMenuButton.displayName = 'SidebarMenuButton';


export const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('mt-auto border-t p-4', className)}
      {...props}
    />
  );
});
SidebarFooter.displayName = 'SidebarFooter';

export const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, ...props }, ref) => {
  const { isOpen, setIsOpen } = useSidebar();

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      onClick={() => setIsOpen(!isOpen)}
      className={cn('h-8 w-8', className)}
      {...props}
    >
      {isOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
    </Button>
  );
});
SidebarTrigger.displayName = 'SidebarTrigger';

export const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { isOpen } = useSidebar();
  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-300 ease-in-out',
        isOpen ? 'ml-64' : 'ml-16',
        className
      )}
      {...props}
    />
  );
});
SidebarInset.displayName = 'SidebarInset';
