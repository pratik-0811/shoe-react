import React, { ReactNode } from 'react';

interface ResponsiveGridProps {
  children: ReactNode;
  className?: string;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  minItemWidth?: string;
}

const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className = '',
  cols = { default: 1, sm: 2, md: 3, lg: 4, xl: 4 },
  gap = 'md',
  minItemWidth
}) => {
  const gapClasses = {
    sm: 'gap-1.5 sm:gap-2',
    md: 'gap-2 sm:gap-3 md:gap-4',
    lg: 'gap-3 sm:gap-4 md:gap-6',
    xl: 'gap-4 sm:gap-6 md:gap-8'
  };

  // Build responsive grid classes
  const gridClasses = [];
  
  if (cols.default) gridClasses.push(`grid-cols-${cols.default}`);
  if (cols.sm) gridClasses.push(`sm:grid-cols-${cols.sm}`);
  if (cols.md) gridClasses.push(`md:grid-cols-${cols.md}`);
  if (cols.lg) gridClasses.push(`lg:grid-cols-${cols.lg}`);
  if (cols.xl) gridClasses.push(`xl:grid-cols-${cols.xl}`);

  // Use CSS Grid with minmax for truly responsive design
  const gridStyle = minItemWidth ? {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fill, minmax(min(${minItemWidth}, 100%), 1fr))`,
    gap: {
      sm: '0.375rem',
      md: '0.75rem',
      lg: '1rem',
      xl: '1.5rem'
    }[gap]
  } : undefined;

  return (
    <div 
      className={`grid ${gridClasses.join(' ')} ${gapClasses[gap]} ${className}`}
      style={gridStyle}
    >
      {children}
    </div>
  );
};

export default ResponsiveGrid;