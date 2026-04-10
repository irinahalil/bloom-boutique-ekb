import Layout from '@/components/Layout';
import { Truck, Clock, MapPin } from 'lucide-react';

const Delivery = () => (
  <Layout>
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Доставка</h1>
      <p className="text-muted-foreground mb-10">
        Мы доставляем свежие тюльпаны по всему Екатеринбургу
      </p>

      <div className="space-y-8">
        <div className="bg-card border rounded-2xl p-8">
          <div className="flex items-start gap-4">
            <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h2 className="font-display text-xl font-semibold mb-2">Зоны доставки</h2>
              <p className="text-muted-foreground leading-relaxed">
                Доставляем по всему Екатеринбургу и ближайшим пригородам: Верхняя Пышма, Берёзовский, Арамиль.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-8">
          <div className="flex items-start gap-4">
            <Clock className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h2 className="font-display text-xl font-semibold mb-2">Сроки</h2>
              <ul className="text-muted-foreground space-y-2">
                <li>• <strong>Экспресс-доставка:</strong> от 1,5 до 2 часов</li>
                <li>• <strong>К определённому времени:</strong> выбирайте удобный интервал</li>
                <li>• <strong>Работаем:</strong> ежедневно с 8:00 до 21:00</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-8">
          <div className="flex items-start gap-4">
            <Truck className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h2 className="font-display text-xl font-semibold mb-2">Стоимость</h2>
              <ul className="text-muted-foreground space-y-2">
                <li>• <strong>Бесплатно</strong> при заказе от 3000 ₽</li>
                <li>• <strong>300 ₽</strong> — доставка по городу</li>
                <li>• <strong>500 ₽</strong> — пригород</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Layout>
);

export default Delivery;
