import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const TopBar: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const location = useLocation();

  useEffect(() => {
    // Start animation on route change
    setProgress(30);
    const t1 = setTimeout(() => setProgress(60), 100);
    const t2 = setTimeout(() => setProgress(100), 300);
    const t3 = setTimeout(() => setProgress(0), 600); // Hide after finish

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [location.pathname]);

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-[100] pointer-events-none">
      <div 
        className="h-full bg-emerald-400 shadow-[0_0_10px_#10b981] transition-all duration-300 ease-out"
        style={{ width: `${progress}%`, opacity: progress > 0 ? 1 : 0 }}
      />
    </div>
  );
};