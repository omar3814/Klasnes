import React from 'react';
import { SunIcon, MoonIcon, UserCircleIcon } from './icons/Icons.tsx';
import { Page } from '../App';

interface HeaderProps {
  session: any | null;
  onSignInClick?: () => void;
  navigateTo: (page: Page) => void;
  onSignOut: () => void;
  websiteLogo: string | null;
}

const Header: React.FC<HeaderProps> = ({ session, onSignInClick, navigateTo, onSignOut, websiteLogo }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [theme, setTheme] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  });

  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const DefaultLogo = () => (
      <svg width="140" height="40" viewBox="0 0 140 50" xmlns="http://www.w3.org/2000/svg" aria-label="Klasen Logo">
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#14B8A6" />
          </linearGradient>
        </defs>
        <g transform="translate(15, 2)">
          <g transform="translate(0, 5)" aria-label="Success icon"><circle cx="10" cy="6" r="2.5" fill="#14B8A6" /><path d="M10 8.5 V 13 M 6 11 H 14" stroke="#14B8A6" strokeWidth="1.5" strokeLinecap="round" /><circle cx="10" cy="1" r="3" fill="#14B8A6" /><path d="M9 1 L 9.8 2 L 11.5 0" stroke="white" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>
          <g transform="translate(22, 5)" aria-label="Warning icon"><path d="M10 0 L20 17 H0 Z" fill="#FBBF24" /><path d="M6 6 L14 14 M14 6 L6 14" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" /></g>
          <g transform="translate(50, 6)" aria-label="Data visualization icon" stroke="#9CA3AF"><polyline points="0,12 4,8 8,10 12,4 16,6" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><rect x="20" y="7" width="3" height="8" fill="#9CA3AF" stroke="none" /><rect x="25" y="3" width="3" height="12" fill="#9CA3AF" stroke="none" /><rect x="30" y="5" width="3" height="10" fill="#9CA3AF" stroke="none" /></g>
          <g transform="translate(90, 7)" aria-label="Analysis icon"><circle cx="5" cy="5" r="4" stroke="#14B8A6" strokeWidth="1.5" fill="none" /><line x1="8.5" y1="8.5" x2="13" y2="13" stroke="#14B8A6" strokeWidth="1.5" strokeLinecap="round" /></g>
        </g>
        <text x="15" y="40" fontFamily="Inter, sans-serif" fontSize="22" fontWeight="800" fill="url(#logoGradient)" letterSpacing="-0.5">Klasen</text>
        <path d="M 87 40 C 92 40, 97 35, 102 42" stroke="url(#logoGradient)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </svg>
  );

  return (
    <header className="bg-card shadow-sm border-b border-border sticky top-0 z-40 transition-colors duration-300">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex justify-between items-center py-3">
          <button onClick={() => navigateTo('dashboard')} className="flex items-center gap-2 text-xl font-bold text-foreground">
              {websiteLogo ? <img src={websiteLogo} alt="Klasen Logo" className="h-10 object-contain" /> : <DefaultLogo />}
          </button>

          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-full text-foreground-muted hover:bg-muted">
              {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
            </button>

            {session ? (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  onBlur={() => setTimeout(() => setIsMenuOpen(false), 200)}
                  className="flex items-center"
                >
                  <UserCircleIcon className="w-8 h-8 text-foreground-muted" />
                </button>
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-xl border border-border z-50 py-1">
                    <button
                      onClick={() => { navigateTo('profile'); setIsMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-card-foreground hover:bg-muted"
                    >
                      Your Profile
                    </button>
                    <button
                      onClick={onSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-card-foreground hover:bg-muted"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              onSignInClick && <button onClick={onSignInClick} className="px-4 py-2 font-semibold text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;