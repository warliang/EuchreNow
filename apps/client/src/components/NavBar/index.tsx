type Props = {
  currentView: 'home' | 'howto' | 'leaderboard';
  onNavClick: (newView: 'home' | 'howto' | 'leaderboard') => void;
};

const NavBar = (props: Props) => {
  const { currentView, onNavClick } = props;

  const navItems: { label: string; view: 'home' | 'howto' | 'leaderboard' }[] = [
    { label: 'Home', view: 'home' },
    { label: 'How To Play', view: 'howto' },
    { label: 'Leaderboard', view: 'leaderboard' },
  ];

  return (
    <div className="flex justify-between items-center h-navbar-height border-b-2 border-border px-4">
      <div className="flex items-center">
        <h1 className="text-3xl font-bold text-primary mr-5">EuchreNow</h1>
        <div className="flex">
          {navItems.map((item) => (
            <button
              key={item.view}
              aria-selected={currentView === item.view}
              onClick={() => onNavClick(item.view)}
              className="cursor-pointer text-lg px-2 rounded-xl aria-selected:bg-active-bg"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div>User</div>
    </div>
  );
};

export default NavBar;
