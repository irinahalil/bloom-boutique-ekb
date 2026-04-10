import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import Layout from '@/components/Layout';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Minus, Plus, ArrowLeft } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: related } = useQuery({
    queryKey: ['related-products', product?.category, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', product!.category)
        .neq('id', id!)
        .limit(3);
      if (error) throw error;
      return data;
    },
    enabled: !!product,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-10">
          <div className="animate-pulse grid md:grid-cols-2 gap-12">
            <div className="aspect-square rounded-3xl bg-muted" />
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-2/3" />
              <div className="h-5 bg-muted rounded w-1/3" />
              <div className="h-20 bg-muted rounded" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-5xl mb-4">😔</p>
          <p className="text-xl text-muted-foreground">Товар не найден</p>
          <Link to="/catalog">
            <Button variant="outline" className="mt-4 rounded-full">Вернуться в каталог</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Link to="/catalog" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Назад в каталог
        </Link>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="aspect-square rounded-3xl overflow-hidden bg-muted">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-9xl">🌷</div>
            )}
          </div>

          <div className="flex flex-col justify-center">
            {product.color && (
              <span className="text-xs font-medium text-primary tracking-widest uppercase mb-2">
                {product.color}
              </span>
            )}
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">{product.name}</h1>
            {product.description && (
              <p className="text-muted-foreground leading-relaxed mb-6">{product.description}</p>
            )}

            <p className="font-display text-3xl font-semibold mb-8">{product.price} ₽</p>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border rounded-full">
                <button className="p-3 hover:bg-muted rounded-l-full transition" onClick={() => setQty(q => Math.max(1, q - 1))}>
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 font-medium min-w-[2rem] text-center">{qty}</span>
                <button className="p-3 hover:bg-muted rounded-r-full transition" onClick={() => setQty(q => q + 1)}>
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <Button
                size="lg"
                className="rounded-full flex-1"
                onClick={() => { addItem(product, qty); setQty(1); }}
                disabled={!product.in_stock}
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                {product.in_stock ? 'В корзину' : 'Нет в наличии'}
              </Button>
            </div>
          </div>
        </div>

        {/* Related */}
        {related && related.length > 0 && (
          <section className="mt-20">
            <h2 className="font-display text-2xl font-semibold mb-8">Похожие букеты</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {related.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
};

export default ProductDetail;
