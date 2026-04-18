import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import Layout from '@/components/Layout';
import { Truck, Clock, Flower2, ArrowRight, Search } from 'lucide-react';

const Index = () => {
  const { data: products } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('in_stock', true)
        .order('created_at', { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-primary tracking-widest uppercase mb-4">
              Екатеринбург
            </p>
            <h1 className="font-display md:text-8xl lg:text-9xl font-bold leading-[1.05] mb-6 text-6xl">
              Тюльпаны,
              <br />
              <span className="text-primary italic">которые вдохновляют</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-md">
              Свежие букеты из голландских тюльпанов с доставкой по Екатеринбургу за 2 часа. 
              Каждый букет — маленькая весна.
            </p>
            <Link to="/catalog">
              <Button size="lg" className="rounded-full px-8 text-base">
                <Search className="w-4 h-4 mr-2" />
                Выбрать букет
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
          <div className="w-full h-full text-[20rem] flex items-center justify-center">🌷</div>
        </div>
      </section>

      {/* Popular products */}
      {products && products.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-sm text-primary font-medium tracking-widest uppercase mb-2">Популярное</p>
              <h2 className="font-display text-3xl md:text-4xl font-semibold">Наши букеты</h2>
            </div>
            <Link to="/catalog" className="text-sm text-primary font-medium hover:underline hidden md:block">
              Все букеты →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Link to="/catalog">
              <Button variant="outline" className="rounded-full">Все букеты</Button>
            </Link>
          </div>
        </section>
      )}

      {/* Benefits */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Flower2, title: 'Свежие цветы', desc: 'Получаем тюльпаны напрямую из Голландии каждую неделю' },
              { icon: Clock, title: 'Доставка за 2 часа', desc: 'Быстрая доставка по всему Екатеринбургу' },
              { icon: Truck, title: 'Бесплатно от 3000 ₽', desc: 'Бесплатная доставка при заказе от 3000 рублей' },
            ].map((item, i) => (
              <div key={i} className="text-center p-8 rounded-3xl bg-background/60 backdrop-blur">
                <item.icon className="w-8 h-8 text-primary mx-auto mb-4" />
                <h3 className="font-display text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Delivery CTA */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-secondary/50 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <h2 className="font-display text-3xl font-semibold mb-3">Доставка по Екатеринбургу</h2>
            <p className="text-muted-foreground">
              Мы доставляем букеты по всему городу. Узнайте подробности о зонах, сроках и стоимости доставки.
            </p>
          </div>
          <Link to="/delivery">
            <Button variant="outline" className="rounded-full px-8">
              Подробнее о доставке
            </Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
