# Настройка GitHub Pages

## Важно! После пуша нужно:

1. **Включить GitHub Pages:**
   - Откройте: https://github.com/pavelaleks/samarkand_lectures/settings/pages
   - В разделе "Source" выберите: **GitHub Actions**
   - Сохраните настройки

2. **Проверить деплой:**
   - Откройте: https://github.com/pavelaleks/samarkand_lectures/actions
   - Дождитесь завершения workflow "Deploy to GitHub Pages"
   - Должна появиться зелёная галочка

3. **Открыть сайт:**
   - После завершения деплоя сайт будет доступен по адресу:
   - **https://pavelaleks.github.io/samarkand_lectures/**

## Если GitHub Pages показывает 404:

1. Убедитесь, что в настройках репозитория → Pages → Source выбран **GitHub Actions**
2. Проверьте, что workflow завершился успешно (зелёная галочка)
3. Подождите 1-2 минуты после завершения workflow
4. Очистите кеш браузера (Ctrl+Shift+Del)

## Структура деплоя:

- Все файлы собираются в папку `dist/`
- Статические файлы (HTML, PDF) копируются в `dist/src/data/`
- Base URL: `/samarkand_lectures/`

