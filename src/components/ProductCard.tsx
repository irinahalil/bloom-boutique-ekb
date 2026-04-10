import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import type { Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;

const ProductCard = ({ product }: { product: Product }) => {
  const { addItem } = useCart();

  return (
    <div className="group relative">
      <Link to={`/product/${product.id}`}>
        <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-muted mb-4">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">🌷</div>
          )}
        </div>
        <h3 className="font-display text-lg font-medium group-hover:text-primary transition-colors">{product.name}</h3>
        {product.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
        )}
      </Link>
      <div className="flex items-center justify-between mt-3">
        <span className="font-display text-xl font-semibold">{product.price} ₽</span>
        <Button
          size="sm"
          className="rounded-full"
          onClick={(e) => {
            e.preventDefault();
            addItem(product);
          }}
          disabled={!product.in_stock}
        >
          <ShoppingBag className="w-4 h-4 mr-1" />
          {product.in_stock ? 'В корзину' : 'Нет в наличии'}
        </Button>
      </div>
    </div>
  );
};

export default ProductCard;
