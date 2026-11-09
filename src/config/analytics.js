/**
 * Яндекс Метрика: статистика посещений сайта.
 *
 * 1. metrika.yandex.ru → «Добавить счётчик»: адрес pavelaleks.github.io/samarkand_lectures,
 *    включить «Вебвизор, карта скроллинга, аналитика форм».
 * 2. Номер счётчика (8–9 цифр) вписать ниже вместо 0.
 * 3. Чтобы статистику видели все: Настройки счётчика → «Доступ» → «Публичный доступ к статистике» — включить.
 *    Чтобы на странице кабинета была видна цифра посещений: Настройки → «Информер» → включить.
 *
 * Пока здесь 0 — счётчик не загружается и блок статистики в кабинете не показывается.
 */
export const YM_ID = 0

export const metrikaReport = (id = YM_ID) => `https://metrika.yandex.ru/dashboard?id=${id}`
export const metrikaInformer = (id = YM_ID) => `https://informer.yandex.ru/informer/${id}/3_1_FFFFFFFF_EFEFEFFF_0_pageviews`
