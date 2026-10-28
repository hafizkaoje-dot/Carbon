import { useState, useEffect, useRef, ReactNode } from 'react';

interface Props {
  children: (dimensions: { width: number; height: number }) => ReactNode;
  width?: string | number;
  height?: number;
  className?: string;
}

/**
 * Safe chart container that replaces Recharts' ResponsiveContainer
 * Avoids the "Cannot read properties of null (reading 'useCallback')" error
 * by using a simpler dimension-tracking approach
 */
export function SafeChartContainer({ children, width = '100%', height = 200, className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    // Initial measurement
    updateDimensions();

    // Use ResizeObserver for responsive updates
    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Only render children when mounted and dimensions are valid
  if (!isMounted || dimensions.width === 0 || dimensions.height === 0) {
    return (
      <div
        ref={containerRef}
        className={className}
        style={{ width, height }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width, height }}
    >
      {children(dimensions)}
    </div>
  );
}
