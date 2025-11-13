import React from 'react';

interface NavButtonProps {
  onClick: () => void;
  icon: React.ReactElement;
  label: string;
  color: string;
}

const NavButton: React.FC<NavButtonProps> = ({ onClick, icon, label, color }) => {
  return (
    <button
      onClick={onClick}
      className={`group relative rounded-2xl p-4 flex items-center gap-4 text-white overflow-hidden transform-gpu transition-transform duration-300 ease-in-out hover:scale-[1.03] focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:focus-visible:ring-offset-background focus-visible:ring-primary`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Background Gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${color} transition-transform duration-300 ease-in-out group-hover:scale-110`}
        style={{ transform: 'translateZ(-20px)' }}
      />
      
      {/* Shine Effect */}
      <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent transform-gpu transition-all duration-500 ease-in-out group-hover:left-[100%]" />

      {/* Glow Effect */}
      <div className={`absolute -inset-4 bg-gradient-to-br ${color} opacity-0 transition-opacity duration-500 group-hover:opacity-40 blur-2xl`} />

      {/* Icon Wrapper */}
      <div className="relative z-10 w-14 h-14 flex items-center justify-center bg-white/20 rounded-xl flex-shrink-0" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
        {icon}
      </div>
      
      {/* Text Content */}
      <div className="relative z-10" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
        <h3 className="text-lg font-bold tracking-tight text-left">{label}</h3>
      </div>
    </button>
  );
};

export default NavButton;