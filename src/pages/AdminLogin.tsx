import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const AdminLogin = () => {
  const { user, isAdmin, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signIn } = useAuth();

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </Layout>
    );
  }

  if (user && isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast.error('Неверный email или пароль');
    }
    setSubmitting(false);
  };

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl font-bold text-center mb-8">Вход в админку</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="rounded-xl"
              required
            />
            <Input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="rounded-xl"
              required
            />
            <Button type="submit" className="w-full rounded-full" disabled={submitting}>
              {submitting ? 'Вход...' : 'Войти'}
            </Button>
          </form>
          {user && !isAdmin && (
            <p className="text-sm text-destructive text-center mt-4">
              У вас нет прав администратора
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminLogin;
