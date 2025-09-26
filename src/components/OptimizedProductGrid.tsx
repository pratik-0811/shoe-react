import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import ProductCard from './ProductCard';
import { Product } from '../types';

interface OptimizedProductGridProps {
  products: Product[];
  loading?: boolean;
  itemsPerRow?: number;
  itemHeight?: number;
  containerHeight?: number;
}

interface GridItemProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    products: Product[];
    itemsPerRow: number;
  };
}

const GridItem = memo(({ columnIndex, rowIndex, style, data }: GridItemProps) => {
  const { products, itemsPerRow } = data;
  const index = rowIndex * itemsPerRow + columnIndex;
  const product = products[index];

  if (!product) {
    return <div style={style} />;
  }

  return (
    <div style={{ ...style, padding: '8px' }}>
      <ProductCard product={product} index={index} />
    </div>
  );
});

GridItem.displayName = 'GridItem';

const OptimizedProductGrid: React.FC<OptimizedProductGridProps> = ({
  products,
  loading = false,
  itemsPerRow = 4,
  itemHeight = 400,
  containerHeight = 600
}) => {
  const [containerWidth, setContainerWidth] = useState(1200);

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      const container = document.querySelector('.product-grid-container');
      if (container) {
        setContainerWidth(container.clientWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const gridData = useMemo(() => ({
    products,
    itemsPerRow
  }), [products, itemsPerRow]);

  const rowCount = useMemo(() => 
    Math.ceil(products.length / itemsPerRow),
    [products.length, itemsPerRow]
  );

  const columnWidth = useMemo(() => 
    containerWidth / itemsPerRow,
    [containerWidth, itemsPerRow]
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No products found</p>
      </div>
    );
  }

  return (
    <div className="product-grid-container w-full">
      <Grid
        columnCount={itemsPerRow}
        columnWidth={columnWidth}
        height={containerHeight}
        rowCount={rowCount}
        rowHeight={itemHeight}
        itemData={gridData}
        overscanRowCount={2}
        overscanColumnCount={1}
      >
        {GridItem}
      </Grid>
    </div>
  );
};

export default memo(OptimizedProductGrid);