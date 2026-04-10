import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const Cart = () => {
  const { items, updateQuantity, removeItem, clearCart, totalPrice } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '', comment: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      toast.error('Заполните обязательные поля');
      return;
    }
    if (items.length === 0) return;

    setLoading(true);
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: form.name.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          comment: form.comment.trim() || null,
          total: totalPrice,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      clearCart();
      toast.success('Заказ оформлен! Мы свяжемся с вами в ближайшее время.');
      navigate('/');
    } catch (err) {
      console.error(err);
      toast.error('Ошибка при оформлении заказа');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-6xl mb-4">🛒</p>
          <h1 className="font-display text-3xl font-semibold mb-2">Корзина пуста</h1>
          <p className="text-muted-foreground mb-6">Добавьте тюльпаны из каталога</p>
          <Button className="rounded-full" onClick={() => navigate('/catalog')}>
            Перейти в каталог
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10">
        <h1 className="font-display text-4xl font-bold mb-8">Корзина</h1>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <div key={item.product.id} className="flex items-center gap-4 p-4 rounded-2xl bg-card border">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                  {item.product.image_url ? (
                    <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🌷</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-medium truncate">{item.product.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.product.price} ₽</p>
                </div>
                <div className="flex items-center border rounded-full">
                  <button className="p-2 hover:bg-muted rounded-l-full" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="px-3 text-sm font-medium">{item.quantity}</span>
                  <button className="p-2 hover:bg-muted rounded-r-full" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <p className="font-medium w-20 text-right">{item.product.price * item.quantity} ₽</p>
                <button className="p-2 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.product.id)}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Order form */}
          <div className="bg-card border rounded-2xl p-6">
            <h2 className="font-display text-xl font-semibold mb-6">Оформление заказа</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Имя *</label>
                <Input
                  placeholder="Ваше имя"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="rounded-xl"
                  required
                  maxLength={100}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Телефон *</label>
                <Input
                  placeholder="+7 (___) ___-__-__"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="rounded-xl"
                  required
                  maxLength={20}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Адрес доставки *</label>
                <Input
                  placeholder="Улица, дом, квартира"
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  className="rounded-xl"
                  required
                  maxLength={255}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Комментарий</label>
                <Textarea
                  placeholder="Пожелания к заказу"
                  value={form.comment}
                  onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                  className="rounded-xl"
                  maxLength={500}
                />
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between text-lg font-display font-semibold">
                  <span>Итого:</span>
                  <span>{totalPrice} ₽</span>
                </div>
              </div>

              <Button type="submit" className="w-full rounded-full" size="lg" disabled={loading}>
                {loading ? 'Оформляем...' : 'Оформить заказ'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Cart;
