/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) { //объява ф
   // @TODO: Расчет выручки от операции
   const { discount, sale_price, quantity } = purchase; // открываем что такое пукчейз
   
   const paymentRatio = 1 - (discount / 100); // сколько платит при опр скидке
   
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
function calculateBonusByProfit(index, total, seller) { //объява ф расчета бонуса, берем индекс продавцв сколько их и инфу про конкетного
    // @TODO: Расчет бонуса от позиции в рейтинге
    let profit = seller.profit; //прибыль конкр продавцы
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
    // @TODO: Проверка входных данных
    if (!data || !data.sellers || !data.purchase_records || !data.products) { // если не дата и пр то ошибка
        console.error("Ошибка: Данные отсутствуют или повреждены");
        return []; // вернут обязательно пустой массив чтоб не сломалось (почему см @returns)
    }
    // @TODO: Проверка наличия опций
    const { calculateRevenue, calculateBonus } = options; // смотрим в опц - это объект из двух фенкций
    if (typeof calculateRevenue !== 'function' || typeof calculateBonus !== 'function') { //если тип не тот то ощибка
        console.error("Ошибка: Функции для расчетов не переданы");
        return []; // та же история
    }
    // @TODO: Подготовка промежуточных данных для сбора статистики
    // @TODO: Индексация продавцов и товаров для быстрого доступа
    // Делаем справочник товаров по SKU для быстрого доступа
    const productsMap = {};  // пустой объект для продуктов
    data.products.forEach(p => { // продукт из даты продуктов
        productsMap[p.sku] = p; // ключ productsMap[p.sku] то есть скю из даты продуктов и значение это весь объект из даты продуктов
    });

    // Создаем заготовки для отчетов по каждому продавцу
    // Ключом будет seller_id
    const sellerStats = {}; // создаем пустой объект про продавца
    data.sellers.forEach(s => { // берем продавца С из массив продавцов 
        sellerStats[s.id] = { // формируем ключ sellerStats[s.id] и значение в {}
            seller_id: s.id, // из даты
            name: `${s.first_name} ${s.last_name}`, // из даты
            revenue: 0, // считаем ниже
            profit: 0, // считаем ниже
            sales_count: 0, // считаем ниже
            products_sold: {} // Здесь будем копить: { 'SKU_1': 5, 'SKU_2': 10 }
        };
    });


    // @TODO: Расчет выручки и прибыли для каждого продавца
    // Выполнение основных действий (сбор статистики)
    data.purchase_records.forEach(receipt => { //в массиве чеков смотрим каждый чек
        const currentSeller = sellerStats[receipt.seller_id]; // продавец из чека
        if (!currentSeller) return; // если нет то ищем дальше такого же продавцв для добавления продаж

        currentSeller.sales_count++; // счетчик продаж

        receipt.items.forEach(item => { // смотрим каждый товар в чеке
            const product = productsMap[item.sku]; //товар по скю тк нужно будет получить доп инфу по нем
            

            // 1. Выручка 
            const itemRevenue = calculateRevenue(item, product); // результат функции с нашим конкретным товаром и доп инфой о нем (см в аргуметах функции)
            currentSeller.revenue += itemRevenue; //записывем каждую продажу конкретному продавцу по совпадаюзему чеку

            // 2. Прибыль: Выручка минус (Закупочная цена * Кол-во)
            const itemCost = product.purchase_price * item.quantity; // закупка из массива который дан изначально на количество в чеке
            currentSeller.profit += (itemRevenue - itemCost); // записываем продавцу прибыль где прибыль это вырукчка минус закупка

            // 3. Собираем данные для Топ-10 товаров
            if (!currentSeller.products_sold[item.sku]) {  //если скю (ключ) товара не записано в селлер_айди то записываем ему 0 (значение)
                currentSeller.products_sold[item.sku] = 0;
            }
            currentSeller.products_sold[item.sku] += item.quantity; // добавляем каждое повтор скю к конретному продавцк
        });
    });

    // @TODO: Сортировка продавцов по прибыли

    // превращаем объект в массив, чтобы его можно было потом сортировать (метод сорт не раб для объектов)
    const sellersArray = Object.values(sellerStats); 

    // сортируем от самой большой прибыли (профит) к самой маленькой
    // (b - a) дает сортировку по убыванию
    sellersArray.sort((a, b) => b.profit - a.profit);

    const totalSellers = sellersArray.length; // сколько всего продавцов - по длине массива - дальше для бонуса

    // Теперь проходим по отсортированному массиву и считаем бонусы и Топ-10
    const finalReport = sellersArray.map((seller, index) => { //будет новый массив на основе селлерс аррэй
        
        // @TODO: Назначение премий на основе ранжирования
        seller.bonus = calculateBonus(index, totalSellers, seller); // считаем бонус по функции для него вверху и нужен индекс чтобы распределить их места по прибыли
        
          
        const sortedProducts = Object.entries(seller.products_sold) // берем все проданные товары конкоетного продавца 
            .map(([sku, quantity]) => ({ sku, quantity })) // делаем из них список
            .sort((a, b) => b.quantity - a.quantity) // сортируем по количеству
            .slice(0, 10); // берем первые 10

        // @TODO: Подготовка итоговой коллекции с нужными полями
        return { // возвращаем вот такой объект (см заготовку выше)
            seller_id: seller.seller_id, // по s.id из массива селлерс
            name: seller.name, // тоже из селлерс
            revenue: seller.revenue, // выручка по продавцу, см расчет выркчки
            profit: seller.profit, // см рассчет прибыли
            sales_count: seller.sales_count, // счетчик продаж
            top_products: sortedProducts, // сортировка и топ 10 товаров
            bonus: seller.bonus // бонус по функции рассчета (нужны все продавцы, индекс каждого и конкретный продавец из массива)
        };
    });

    console.log('--- ИТОГОВЫЙ ОТЧЕТ ---');
    console.log(finalReport); // проверка

    return finalReport; // результат
}
