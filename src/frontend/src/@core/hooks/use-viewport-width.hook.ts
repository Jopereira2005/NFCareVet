import { useEffect, useState } from 'react';

export function useViewportWidth(): number {
  const [width, setWidth] = useState<number>(
    typeof window === 'undefined' ? 0 : window.innerWidth,
  );

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return width;
}
