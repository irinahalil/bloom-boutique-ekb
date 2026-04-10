import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from '@/components/ProductCard';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';

const categories = [
  { value: '', label: 'Все' },
  { value: 'bouquet', label: 'Букеты' },
  { value: 'box', label: 'В коробке' },
  { value: 'single', label: 'Поштучно' },
];

const colors = [
  { value: '', label: 'Все цвета' },
  { value: 'red', label: '🔴 Красные' },
  { value: 'pink', label: '🩷 Розовые' },
  { value: 'white', label: '⚪ Белые' },
  { value: 'yellow', label: '🟡 Жёлтые' },
  { value: 'purple', label: '🟣 Фиолетовые' },
  { value: 'mix', label: '🌈 Микс' },
];

const Catalog = () => {
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('');

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', category, color],
    queryFn: async () => {
      let query = supabase.from('products').select('*').order('created_at', { ascending: false });
      if (category) query = query.eq('category', category);
      if (color) query = query.eq('color', color);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10">
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-2">Каталог</h1>
        <p className="text-muted-foreground mb-8">Выберите идеальный букет тюльпанов</p>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-10">
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <Button
                key={c.value}
                variant={category === c.value ? 'default' : 'outline'}
                size="sm"
                className="rounded-full"
                onClick={() => setCategory(c.value)}
              >
                {c.label}
              </Button>
            ))}
          </div>
          <div className="w-px bg-border mx-2 hidden md:block" />
          <div className="flex flex-wrap gap-2">
            {colors.map(c => (
              <Button
                key={c.value}
                variant={color === c.value ? 'default' : 'outline'}
                size="sm"
                className="rounded-full"
                onClick={() => setColor(c.value)}
              >
                {c.label}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] rounded-2xl bg-muted mb-4" />
                <div className="h-5 bg-muted rounded w-2/3 mb-2" />
                <div className="h-4 bg-muted rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🌷</p>
            <p className="text-muted-foreground">Пока нет товаров в этой категории</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Catalog;
