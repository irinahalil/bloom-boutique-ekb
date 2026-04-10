import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="bg-muted/50 border-t mt-20">
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="font-display text-xl font-semibold text-primary mb-3">🌷 Тюльпаны Екб</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Свежие тюльпаны с доставкой по Екатеринбургу. Каждый букет собираем с любовью.
          </p>
        </div>
        <div>
          <h4 className="font-display text-lg font-medium mb-3">Навигация</h4>
          <div className="space-y-2">
            <Link to="/catalog" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Каталог</Link>
            <Link to="/delivery" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Доставка</Link>
            <Link to="/admin" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Админ</Link>
          </div>
        </div>
        <div>
          <h4 className="font-display text-lg font-medium mb-3">Информация</h4>
          <div className="space-y-2">
            <Link to="/privacy" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Политика конфиденциальности</Link>
            <Link to="/offer" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Публичная оферта</Link>
          </div>
          <p className="text-sm text-muted-foreground mt-4">📞 +7 (343) 000-00-00</p>
          <p className="text-sm text-muted-foreground">✉️ hello@tulips-ekb.ru</p>
        </div>
      </div>
      <div className="border-t mt-8 pt-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Тюльпаны Екб. Все права защищены.
      </div>
    </div>
  </footer>
);

export default Footer;
