import { useEffect, useState } from 'react';

import { socket } from './socket.ts';

import NavBar from './components/NavBar';
import Home from './pages/Home';

function App() {
  const [view, setView] = useState<'home' | 'howto' | 'leaderboard'>('home');

  const handleNavClick = (newView: 'home' | 'howto' | 'leaderboard') => {
    setView(newView);
  };

  useEffect(() => {
    // TODO: will need to handle auth and reconnection logic eventually
    socket.connect();

    socket.on('connect', () => {
      console.log('connected to server: ', socket.id);
    });

    return () => {
      socket.off('connect');
    };
  }, []);

  return (
    <div className="h-screen overflow-hidden">
      <NavBar currentView={view} onNavClick={handleNavClick} />
      {view === 'home' && <Home />}
    </div>
  );
}

export default App;
