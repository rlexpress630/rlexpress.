import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, PlusCircle, List, Settings, MapPin } from 'lucide-react';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ path, icon: Icon, label }: { path: string, icon: any, label: string }) => (
    <button
      onClick={() => navigate(path)}
      className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
        isActive(path) 
          ? 'text-primary dark:text-primary' 
          : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
      }`}
    >
      <Icon className={`w-6 h-6 ${isActive(path) ? 'fill-current opacity-20 stroke-[2.5px]' : ''}`} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50 dark:bg-dark-bg border-x border-gray-200 dark:border-dark-border overflow-hidden shadow-2xl">
      <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 w-full max-w-md bg-white dark:bg-dark-surface border-t border-gray-100 dark:border-dark-border h-20 pb-4 px-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
        <div className="flex items-center justify-around h-full">
          <NavItem path="/" icon={Home} label="Início" />
          <NavItem path="/active" icon={MapPin} label="Rotas" />
          
          <div className="relative -top-6">
            <button
              onClick={() => navigate('/add')}
              className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-red-500/40 hover:scale-105 active:scale-95 transition-transform"
            >
              <PlusCircle className="w-8 h-8" />
            </button>
          </div>

          <NavItem path="/history" icon={List} label="Histórico" />
          <NavItem path="/settings" icon={Settings} label="Ajustes" />
        </div>
      </nav>
    </div>
  );
};

export default Layout;