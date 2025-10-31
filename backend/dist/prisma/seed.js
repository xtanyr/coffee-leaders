import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log('Seeding coffee shops...');
    const coffeeShops = [
        { name: 'Кирова', city: 'Санкт-Петербург' },
        { name: 'Мега Омск', city: 'Омск' },
        { name: 'Верхняя', city: 'Нижний Новгород' },
        { name: 'Сфера', city: 'Омск' },
        { name: 'Академгородок', city: 'Новосибирск' },
        { name: 'Новая Голландия', city: 'Санкт-Петербург' },
        { name: 'Тухачевского', city: 'Омск' },
        { name: 'Благовещенский', city: 'Москва' },
        { name: 'Калашный', city: 'Москва' },
        { name: 'ЧВ', city: 'Омск' },
        { name: 'Дружный', city: 'Омск' },
        { name: 'Атлантида', city: 'Омск' },
        { name: 'Комсомольский проспект', city: 'Москва' },
        { name: 'Заельцовская', city: 'Новосибирск' },
        { name: 'Аптека', city: 'Москва' },
        { name: 'Мира', city: 'Омск' },
        { name: 'Слава', city: 'Москва' },
        { name: 'Квадро', city: 'Омск' },
        { name: '22 апреля', city: 'Омск' },
        { name: 'Фестиваль', city: 'Омск' },
        { name: 'Дмитриева', city: 'Омск' },
        { name: 'Невского', city: 'Москва' },
        { name: 'Печерская', city: 'Нижний Новгород' },
        { name: 'Покровская', city: 'Нижний Новгород' },
        { name: 'Мега Новосибирск', city: 'Новосибирск' },
        { name: 'Таганка', city: 'Москва' },
        { name: 'Волкова', city: 'Казань' },
        { name: 'Восстания', city: 'Санкт-Петербург' },
        { name: 'Гагарина', city: 'Омск' },
        { name: 'Геос', city: 'Новосибирск' },
        { name: 'Декабристов', city: 'Казань' },
        { name: 'Черное Озеро', city: 'Казань' },
        { name: 'Интер', city: 'Омск' },
        { name: 'Ковалихинская', city: 'Нижний Новгород' },
        { name: 'Красноармейская', city: 'Самара' },
        { name: 'Водники', city: 'Омск' },
        { name: 'Сибирские Огни', city: 'Омск' },
        { name: 'Куйбышева', city: 'Самара' },
        { name: 'Камергерский', city: 'Омск' },
        { name: 'Ленина', city: 'Новосибирск' },
        { name: 'Лермонтова', city: 'Омск' },
        { name: 'Конюшенная', city: 'Санкт-Петербург' },
        { name: 'Посадская', city: 'Санкт-Петербург' },
        { name: 'Молодогвардейская', city: 'Самара' },
        { name: 'Мясницкая', city: 'Москва' },
        { name: 'Красносельская', city: 'Москва' },
        { name: 'Столбова', city: 'Казань' },
        { name: 'Ново-Садовая', city: 'Самара' },
        { name: 'Хлебозавод', city: 'Москва' },
        { name: 'Казань-молл', city: 'Казань' },
        { name: 'Петербургская', city: 'Казань' },
        { name: 'Пушкина', city: 'Казань' },
        { name: 'Рочдельская', city: 'Москва' },
        { name: 'Галактионовская', city: 'Самара' },
        { name: 'Советская', city: 'Новосибирск' },
        { name: 'Щапова', city: 'Казань' },
        { name: 'Кутузовский', city: 'Москва' },
        { name: 'Чикаго', city: 'Новосибирск' },
        { name: 'Мост', city: 'Новосибирск' },
        { name: 'Арт', city: 'Казань' },
        { name: 'Московский Рынок', city: 'Казань' },
        { name: 'Вокзал', city: 'Санкт-Петербург' },
        { name: 'Баку', city: 'Москва' },
        { name: 'Аркадия', city: 'Москва' },
        { name: 'Столешников', city: 'Москва' },
        { name: 'Волна', city: 'Самара' },
        { name: 'Нобель', city: 'Новосибирск' }
    ];
    for (const shop of coffeeShops) {
        await prisma.coffeeShop.create({
            data: {
                name: shop.name,
                city: shop.city,
                openingDate: null,
            },
        });
        console.log(`Created coffee shop: ${shop.name} in ${shop.city}`);
    }
    console.log('Seeding completed!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map