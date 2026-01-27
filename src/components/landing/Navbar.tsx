import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from '@tanstack/react-router';
import { Menu } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';

const Navbar = () => {
  const navigate = useNavigate();

  const handleSignIn = () => {
    navigate({ to: '/store-admin/login' });
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/faq', label: 'FAQ' },
    { to: '/case-studies', label: 'Case Studies' },
    { to: '/support', label: 'Support' },
  ];

  return (
    <>
      {/* Mobile/Tablet Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between px-6 bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm lg:hidden">
        <Link
          to="/"
          className="flex items-center transition-transform duration-200 ease-in-out hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
        >
          <img src="/coldop-logo.webp" alt="Coldop Logo" className="w-10" />
        </Link>

        <div className="flex items-center gap-3">
          <ModeToggle />
          <Sheet>
            <SheetTrigger className="flex items-center p-2 rounded-lg hover:bg-accent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              <Menu size={24} className="text-foreground" />
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader className="mt-20">
                <SheetDescription asChild>
                  <nav className="font-custom">
                    <ul className="flex list-none flex-col items-center gap-8">
                      {navLinks.map((link) => (
                        <li key={link.to}>
                          <SheetClose asChild>
                            <Link
                              to={link.to}
                              className="text-xl font-medium text-foreground hover:text-primary transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded px-2 py-1"
                            >
                              {link.label}
                            </Link>
                          </SheetClose>
                        </li>
                      ))}
                      <li>
                        <SheetClose asChild>
                          <Button
                            onClick={handleSignIn}
                            variant="default"
                            size="lg"
                            className="font-custom px-8 py-3 text-xl cursor-pointer"
                          >
                            Sign In
                          </Button>
                        </SheetClose>
                      </li>
                    </ul>
                  </nav>
                </SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Desktop Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 hidden h-20 items-center justify-between px-16 bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm lg:flex">
        <Link
          to="/"
          className="flex items-center transition-transform duration-200 ease-in-out hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
        >
          <img src="/coldop-logo.webp" alt="Coldop Logo" className="w-16" />
        </Link>

        <nav className="flex items-center">
          <ul className="flex list-none items-center gap-12">
            {navLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="font-custom text-xl font-medium text-foreground hover:text-primary transition-colors duration-200 relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded px-2 py-1"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-200 ease-in-out group-hover:w-full group-focus-visible:w-full" />
                </Link>
              </li>
            ))}
            <li>
              <ModeToggle />
            </li>
            <li>
              <Button
                onClick={handleSignIn}
                variant="default"
                size="lg"
                className="font-custom px-8 py-3 text-xl"
              >
                Sign In
              </Button>
            </li>
          </ul>
        </nav>
      </header>

      {/* Spacer to prevent content from jumping */}
      <div className="h-16 lg:h-20" />
    </>
  );
};

export default Navbar;
