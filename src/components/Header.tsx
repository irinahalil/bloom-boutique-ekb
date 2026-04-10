import { Link } from 'react-router-dom';
import { ShoppingBag, Menu, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';

const Header = () => {
  const { totalItems } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="font-display text-2xl md:text-3xl font-semibold text-primary tracking-wide">
          🌷 Тюльпаны Екб
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link to="/catalog" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors">
            Каталог
          </Link>
          <Link to="/delivery" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors">
            Доставка
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/cart" className="relative p-2 rounded-full hover:bg-muted transition-colors">
            <ShoppingBag className="w-5 h-5 text-foreground/70" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-medium">
                {totalItems}
              </span>
            )}
          </Link>

          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t bg-background px-4 py-4 space-y-3">
          <Link to="/catalog" className="block text-sm font-medium text-foreground/70" onClick={() => setMenuOpen(false)}>
            Каталог
          </Link>
          <Link to="/delivery" className="block text-sm font-medium text-foreground/70" onClick={() => setMenuOpen(false)}>
            Доставка
          </Link>
        </div>
      )}
    </header>
  );
};

export default Header;
