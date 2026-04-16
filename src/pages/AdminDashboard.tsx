import { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { isToday, isThisWeek, isThisMonth } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, LogOut, Pencil, Trash2, CalendarDays, Clock, TrendingUp, MessageSquare } from 'lucide-react';
import AdminChats from '@/components/AdminChats';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  new: { label: 'Новый', variant: 'default' },
  in_progress: { label: 'В работе', variant: 'secondary' },
  done: { label: 'Выполнен', variant: 'outline' },
};

const emptyProduct = { name: '', description: '', price: '', image_url: '', category: 'bouquet', color: '', in_stock: true };

const uploadImage = async (file: File): Promise<string> => {
  const ext = file.name.split('.').pop();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('product-images').upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
};

const AdminDashboard = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: orders } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(name, image_url))')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const { data: products } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const revenue = useMemo(() => {
    const doneOrders = (orders ?? []).filter(o => o.status === 'done');
    const calc = (filterFn: (date: Date) => boolean) => {
      const filtered = doneOrders.filter(o => filterFn(new Date(o.created_at)));
      return { total: filtered.reduce((s, o) => s + Number(o.total), 0), count: filtered.length };
    };
    return {
      today: calc(d => isToday(d)),
      week: calc(d => isThisWeek(d, { weekStartsOn: 1 })),
      month: calc(d => isThisMonth(d)),
    };
  }, [orders]);

  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('orders').update({ status: status as 'new' | 'in_progress' | 'done' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Статус обновлён');
    },
  });

  const saveProduct = useMutation({
    mutationFn: async () => {
      setUploading(true);
      let imageUrl = productForm.image_url || null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }
      const payload = {
        name: productForm.name,
        description: productForm.description || null,
        price: parseFloat(productForm.price),
        image_url: imageUrl,
        category: productForm.category,
        color: productForm.color || null,
        in_stock: productForm.in_stock,
      };
      if (editingId) {
        const { error } = await supabase.from('products').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['featured-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDialogOpen(false);
      setProductForm(emptyProduct);
      setEditingId(null);
      setImageFile(null);
      setImagePreview(null);
      setUploading(false);
      toast.success(editingId ? 'Товар обновлён' : 'Товар добавлен');
    },
    onError: () => { setUploading(false); toast.error('Ошибка при сохранении'); },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Товар удалён');
    },
  });

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setProductForm({
      name: p.name,
      description: p.description || '',
      price: String(p.price),
      image_url: p.image_url || '',
      category: p.category,
      color: p.color || '',
      in_stock: p.in_stock,
    });
    setImageFile(null);
    setImagePreview(p.image_url || null);
    setDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setProductForm(f => ({ ...f, image_url: '' }));
    }
  };

  if (loading) {
    return <Layout><div className="flex items-center justify-center min-h-[60vh]"><p>Загрузка...</p></div></Layout>;
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-bold">Админ-панель</h1>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-1" /> Выйти
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Сегодня', ...revenue.today },
            { label: 'Неделя', ...revenue.week },
            { label: 'Месяц', ...revenue.month },
          ].map(s => (
            <div key={s.label} className="bg-card border rounded-2xl p-5">
              <p className="text-sm text-muted-foreground mb-1">{s.label}</p>
              <p className="font-display text-2xl font-bold">{s.total.toLocaleString('ru-RU')} ₽</p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> {s.count} {s.count === 1 ? 'заказ' : s.count < 5 ? 'заказа' : 'заказов'}
              </p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="orders">
          <TabsList className="mb-6">
            <TabsTrigger value="orders">Заказы {orders ? `(${orders.length})` : ''}</TabsTrigger>
            <TabsTrigger value="products">Товары {products ? `(${products.length})` : ''}</TabsTrigger>
            <TabsTrigger value="chats">
              <MessageSquare className="w-4 h-4 mr-1" /> Чаты
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <div className="flex gap-2 mb-4 flex-wrap">
              {[{ value: 'all', label: 'Все' }, { value: 'new', label: 'Новые' }, { value: 'in_progress', label: 'В работе' }, { value: 'done', label: 'Выполненные' }].map(f => (
                <Button
                  key={f.value}
                  variant={statusFilter === f.value ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-full"
                  onClick={() => setStatusFilter(f.value)}
                >
                  {f.label}
                </Button>
              ))}
            </div>
            <div className="space-y-4">
              {(orders ?? [])
                .filter(o => statusFilter === 'all' || o.status === statusFilter)
                .map(order => (
                <div key={order.id} className="bg-card border rounded-2xl p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-sm text-muted-foreground">{order.phone}</p>
                      <p className="text-sm text-muted-foreground">{order.address}</p>
                      {order.comment && <p className="text-sm text-muted-foreground italic mt-1">«{order.comment}»</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg font-semibold">{order.total} ₽</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString('ru')}</p>
                    </div>
                  </div>
                  {((order as any).delivery_date || (order as any).delivery_time) && (
                    <div className="flex items-center gap-4 mb-3 text-sm bg-muted/50 rounded-xl px-3 py-2">
                      {(order as any).delivery_date && (
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5 text-primary" />
                          {format(new Date((order as any).delivery_date), 'd MMMM yyyy', { locale: ru })}
                        </span>
                      )}
                      {(order as any).delivery_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          {(order as any).delivery_time}
                        </span>
                      )}
                    </div>
                  )}
                  {order.order_items && order.order_items.length > 0 && (
                    <div className="mb-3 border-t pt-3 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Состав заказа:</p>
                      {order.order_items.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-2 text-sm">
                          {item.products?.image_url && (
                            <img src={item.products.image_url} alt="" className="w-8 h-8 rounded object-cover" />
                          )}
                          <span className="flex-1">{item.products?.name || 'Товар удалён'}</span>
                          <span className="text-muted-foreground">{item.quantity} шт × {item.price} ₽</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Badge variant={statusLabels[order.status]?.variant || 'default'}>
                      {statusLabels[order.status]?.label || order.status}
                    </Badge>
                    <Select
                      value={order.status}
                      onValueChange={(v) => updateOrderStatus.mutate({ id: order.id, status: v })}
                    >
                      <SelectTrigger className="w-40 h-8 text-xs rounded-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Новый</SelectItem>
                        <SelectItem value="in_progress">В работе</SelectItem>
                        <SelectItem value="done">Выполнен</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
              {orders?.length === 0 && (
                <p className="text-center text-muted-foreground py-12">Заказов пока нет</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="products">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full mb-6" onClick={() => { setEditingId(null); setProductForm(emptyProduct); setImageFile(null); setImagePreview(null); }}>
                  <Plus className="w-4 h-4 mr-1" /> Добавить товар
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-display text-xl">{editingId ? 'Редактировать' : 'Новый товар'}</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={e => { e.preventDefault(); saveProduct.mutate(); }}
                  className="space-y-4 pb-2"
                >
                  <Input placeholder="Название *" value={productForm.name} onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))} required maxLength={200} />
                  <Textarea placeholder="Описание" value={productForm.description} onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))} maxLength={1000} />
                  <Input placeholder="Цена *" type="number" min="0" step="0.01" value={productForm.price} onChange={e => setProductForm(f => ({ ...f, price: e.target.value }))} required />
                  <div>
                    <label className="block text-sm font-medium mb-1">Изображение</label>
                    {imagePreview && (
                      <img src={imagePreview} alt="Превью" className="w-full h-32 object-cover rounded-xl mb-2" />
                    )}
                    <Input type="file" accept="image/*" onChange={handleFileChange} />
                    <p className="text-xs text-muted-foreground mt-1">Или вставьте URL:</p>
                    <Input placeholder="URL изображения" value={productForm.image_url} onChange={e => { setProductForm(f => ({ ...f, image_url: e.target.value })); setImageFile(null); setImagePreview(e.target.value || null); }} maxLength={500} className="mt-1" />
                  </div>
                  <Select value={productForm.category} onValueChange={v => setProductForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bouquet">Букет</SelectItem>
                      <SelectItem value="box">В коробке</SelectItem>
                      <SelectItem value="single">Поштучно</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Цвет (red, pink, white...)" value={productForm.color} onChange={e => setProductForm(f => ({ ...f, color: e.target.value }))} maxLength={50} />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={productForm.in_stock} onChange={e => setProductForm(f => ({ ...f, in_stock: e.target.checked }))} />
                    В наличии
                  </label>
                  <Button type="submit" className="w-full rounded-full" disabled={saveProduct.isPending || uploading}>
                    {uploading ? 'Загрузка фото...' : saveProduct.isPending ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <div className="space-y-3">
              {products?.map(p => (
                <div key={p.id} className="flex items-center gap-4 bg-card border rounded-xl p-4">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🌷</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-sm text-muted-foreground">{p.price} ₽ · {p.category} {!p.in_stock && '· Нет в наличии'}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { if (confirm('Удалить товар?')) deleteProduct.mutate(p.id); }}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {products?.length === 0 && (
                <p className="text-center text-muted-foreground py-12">Товаров пока нет</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="chats">
            <AdminChats />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
