import { memo, useCallback } from 'react';
import { Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';

const ThemeToggleComponent = () => {
  const { setTheme, theme } = useTheme();

  // Determine the resolved theme (actual theme being applied)
  const getResolvedTheme = useCallback(() => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return theme;
  }, [theme]);

  const currentTheme = getResolvedTheme();

  const handleToggle = useCallback(() => {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  }, [setTheme, currentTheme]);

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleToggle}
      className="h-9 w-9 relative font-custom"
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};

export const ModeToggle = memo(ThemeToggleComponent);
