import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { useAuthStore } from './stores/useAuthStore';

const App: React.FC = () => {
  const { settings } = useAuthStore();

  useEffect(() => {
    // Apply theme to document root
    const root = document.documentElement;
    root.setAttribute('data-theme', settings.theme);

    if (settings.isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    if (settings.language === 'ar') {
      root.setAttribute('dir', 'rtl');
      root.lang = 'ar';
    } else {
      root.setAttribute('dir', 'ltr');
      root.lang = 'en';
    }
  }, [settings.theme, settings.isDarkMode, settings.language]);

  return <RouterProvider router={router} />;
};

export default App;
