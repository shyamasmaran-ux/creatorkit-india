import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined') {
  const cleanUrl = `${window.location.pathname || '/'}${window.location.search}`;
  window.history.replaceState({ tab: 'home' }, '', cleanUrl);
}

createRoot(document.getElementById('root')!).render(<App />);

