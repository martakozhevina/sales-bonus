/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) { //объявление ф
   // @TODO: Расчет выручки от операции
   const { discount, sale_price, quantity } = purchase; // все из чего складывается продажа
   
   const paymentRatio = 1 - (discount / 100); // коэффициент скидки
   
   const revenue = sale_price * quantity * paymentRatio; // выручка это цена скидка и количество

   return revenue; //результат функ (см @)
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) { //объява ф расчета бонуса, берем индекс продавцв сколько их и прибыль
    // @TODO: Расчет бонуса от позиции в рейтинге
    const { profit } = seller; //прибыль конкр продавца
    let bonusPercent = 0; // начальный бонус

    // первое место
    if (index === 0) {
        bonusPercent = 0.15; // 15%
    } 
    // второе и третье места
    else if (index === 1 || index === 2) {
        bonusPercent = 0.10; // 10%
    } 
    // последнее место
    else if (index === total - 1) {
        bonusPercent = 0;    // 0%
    } 
    // остальные
    else {
        bonusPercent = 0.05; // 5%
    }

    return profit * bonusPercent; // это расчет бонуса в зависимости от процента
}


/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */

function analyzeSalesData(data, options) { // берем функ и кладем в нее нашу дату и опц (ее далее распакуем)

    // @TODO: Проверка входных данных - что это массив и не пуст ли он
    if (!data 
        || !Array.isArray(data.sellers) || data.sellers.length === 0
        || !Array.isArray(data.products) || data.products.length === 0
        || !Array.isArray(data.purchase_records) || data.purchase_records.length === 0
    ) {
        throw new Error('Некорректные входные данные');
    }

    // @TODO: Проверка наличия опций
    // проверяем, что options вообще передан и это объект
    if (!options || typeof options !== 'object') {
        throw new Error('Опции не переданы или не являются объектом');
    }

    const { calculateRevenue, calculateBonus } = options;
    // проверяем, что функции на месте
    if (typeof calculateRevenue !== 'function' || typeof calculateBonus !== 'function') {
        throw new Error('Функции для расчетов не переданы');
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики  
    // Создаем заготовки для отчетов по каждому продавцу    
    const sellersList = data.sellers.map(s => ({ // берем продавца С из массив продавцов        
            seller_id: s.id, // из даты
            name: `${s.first_name} ${s.last_name}`, // из даты
            revenue: 0, // считаем ниже
            profit: 0, // считаем ниже
            sales_count: 0, // считаем ниже
            products_sold: {} // Здесь будем копить: { 'SKU_1': 5, 'SKU_2': 10 }        
    }));

    // Делаем справочник товаров по SKU для быстрого доступа
    const productsMap = {};  // пустой объект для продуктов
    data.products.forEach(p => { // продукт из даты продуктов
        productsMap[p.sku] = p; // ключ productsMap[p.sku] то есть скю из даты продуктов и значение это весь объект из даты продуктов
    });

    // @TODO: Индексация продавцов и товаров для быстрого доступа
    // Индекс для продавцов: берем подготовленные объекты статистики
    // Ключом будет id, значением — сам объект из sellersList
    const sellerIndex = Object.fromEntries(
        sellersList.map(item => [item.seller_id, item])
    );

    // Индекс для товаров: берем данные из исходного массива продуктов
    // Ключом будет sku, значением — весь объект товара (с ценой, себестоимостью и т.д.)
    const productIndex = Object.fromEntries(
        data.products.map(product => [product.sku, product])
    );


    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_receipt.forEach(receipt => { //в массиве чеков смотрим каждый чек
        const seller = sellerIndex[receipt.seller_id]; // продавец из чека
        if (!seller) return; // если нет то ищем дальше такого же продавцв для добавления продаж

        seller.sales_count += 1; // счетчик продаж
        seller.revenue += receipt.total_amount; // увеличиваем общую сумму выручки на общую сумму чека

        receipt.items.forEach(item => { // смотрим каждый товар в чеке
            const product = productIndex[item.sku]; //товар по скю тк нужно будет получить доп инфу по нем
            if (!product) return;

            const cost = product.purchase_price * item.quantity; //себестоисоть
            const itemRevenue = calculateRevenue(item, product); // выручка 1 товара- результат функции с нашим конкретным товаром и доп инфой о нем (см в аргуметах функции)
            const itemProfit = itemRevenue - cost; // прибыль от 1 товара
            seller.profit += itemProfit; // прибыль продавца

            if (!seller.products_sold[item.sku]) { //продаж у продавцв
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity; // счетчк 1 товара у 1 продавцв
        });
    });


    // @TODO: Сортировка продавцов по прибыли
    sellersList.sort((a, b) => b.profit - a.profit);

    // @TODO: Назначение премий на основе ранжирования
    const totalSellers = sellersList.length;

    sellersList.forEach((seller, index) => {
        // 1. Считаем бонус, используя функцию из опций
        // Передаем текущий индекс, общее кол-во и объект продавца
        seller.bonus = calculateBonus(index, totalSellers, seller);

        // 2. Формируем топ-10 товаров
        // Преобразуем объект { 'SKU': 5 } в массив [ ['SKU', 5] ]
        seller.top_products = Object.entries(seller.products_sold)
            // Превращаем в массив объектов для удобства
            .map(([sku, quantity]) => ({ sku, quantity }))
            // Сортируем по количеству (убывание)
            .sort((a, b) => b.quantity - a.quantity)
            // Оставляем только первые 10 записей
            .slice(0, 10);
    });
    
        // @TODO: Подготовка итоговой коллекции с нужными полями
        return sellersList.map(seller => ({ // возвращаем вот такой объект (см заготовку выше)
            seller_id: seller.seller_id, // по s.id из массива селлерс
            name: seller.name, // тоже из селлерс
            revenue: +seller.revenue.toFixed(2),// выручка по продавцу, см расчет выркчки
            profit: +seller.profit.toFixed(2),// см рассчет прибыли
            sales_count: seller.sales_count,// счетчик продаж
            top_products: seller.top_products,// сортировка и топ 10 товаров
            bonus: +seller.bonus.toFixed(2) // бонус по функции рассчета (нужны все продавцы, индекс каждого и конкретный продавец из массива)
        }));

}
