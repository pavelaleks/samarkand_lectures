# 📝 Инструкция: Как закоммитить изменения

## 🎯 Краткая версия (3 шага)

```bash
npm run process-lectures
git add src/data/
git commit -m "Add new materials and presentations"
git push origin main
```

---

## 📋 Подробная инструкция

### Шаг 1: Обработать материалы

После того, как вы добавили файлы (HTML, PDF презентации, PDF материалы) в папки, запустите скрипт обработки:

**В PyCharm (Terminal внизу):**
```bash
npm run process-lectures
```

**Или в PowerShell/CMD:**
```powershell
cd "C:\Users\PC\PycharmProjects\Site Samarkand"
npm run process-lectures
```

**Что делает скрипт:**
- Находит все новые файлы в папках `лекции/`, `презентации/`, `материалы/`
- Обновляет файл `src/data/lectures.json` с информацией о материалах

**Ожидаемый результат:**
```
🔍 Поиск лекций...
  ✓ Найдена презентация: 1.pdf для лекции 1
  ✓ Найдена презентация: 2.pdf для лекции 2
Найдено 51 лекций
✅ Индекс обновлен. Всего лекций: 51
```

---

### Шаг 2: Добавить файлы в Git

**В PyCharm (Terminal):**
```bash
git add src/data/
```

**Что делает команда:**
- Добавляет все файлы из папки `src/data/` в индекс Git (новые PDF, HTML, обновленный `lectures.json`)

**Альтернатива — через PyCharm GUI:**
1. Откройте вкладку "Git" слева
2. Найдите папку `src/data/`
3. Правой кнопкой → `Git → Add`

---

### Шаг 3: Закоммитить изменения

**В PyCharm (Terminal):**
```bash
git commit -m "Add new materials and presentations"
```

**Или с более подробным сообщением:**
```bash
git commit -m "Add presentations and materials for lectures 1-10 (alternative course)"
```

**Что делает команда:**
- Создает коммит (сохраненную версию) всех изменений
- Сообщение (`-m`) описывает, что было добавлено

**Альтернатива — через PyCharm GUI:**
1. В окне "Git" внизу нажмите кнопку "Commit"
2. Введите сообщение коммита
3. Нажмите "Commit"

---

### Шаг 4: Отправить на GitHub

**В PyCharm (Terminal):**
```bash
git push origin main
```

**Что делает команда:**
- Отправляет все коммиты на GitHub
- Запускает автоматический деплой сайта

**Альтернатива — через PyCharm GUI:**
1. В окне "Git" нажмите кнопку "Push"
2. Или `VCS → Git → Push`

---

## ✅ Полный пример (копируйте и вставляйте)

```bash
# 1. Обработать материалы
npm run process-lectures

# 2. Добавить в Git
git add src/data/

# 3. Закоммитить
git commit -m "Add new materials and presentations"

# 4. Отправить на GitHub
git push origin main
```

---

## 🔍 Проверка статуса

Если хотите проверить, какие файлы изменены перед коммитом:

```bash
git status
```

**Что показывает:**
- `modified:` — измененные файлы (например, `lectures.json`)
- `Untracked files:` — новые файлы, которые еще не добавлены в Git

---

## 💡 Полезные советы

1. **Сообщение коммита:**
   - Пишите понятно: что добавлено
   - Примеры хороших сообщений:
     - `"Add presentations for lectures 1-5"`
     - `"Add materials for lecture 7 (alternative course)"`
     - `"Update: add new PDF materials"`

2. **Если забыли запустить `process-lectures`:**
   - Не страшно! Просто запустите его перед `git add`
   - Или запустите после, тогда нужно будет снова `git add src/data/lectures.json`

3. **Если ошибка при `git push`:**
   ```bash
   git pull origin main
   git push origin main
   ```

4. **Проверка после отправки:**
   - Откройте: https://github.com/pavelaleks/samarkand_lectures/actions
   - Убедитесь, что деплой завершился успешно (зеленая галочка ✅)
   - Обычно занимает 2-5 минут

---

## ⚠️ Частые ошибки

**Ошибка:** `npm run process-lectures` не находит файлы
- ✅ Проверьте, что файлы находятся в правильных папках:
  - `src/data/{курс}/лекции/` — для HTML
  - `src/data/{курс}/презентации/` — для PDF презентаций
  - `src/data/{курс}/материалы/` — для PDF материалов

**Ошибка:** `git push` отклонен
- ✅ Выполните сначала:
  ```bash
  git pull origin main
  ```
  Затем снова:
  ```bash
  git push origin main
  ```

**Ошибка:** Файлы не появляются на сайте
- ✅ Проверьте, что запустили `npm run process-lectures`
- ✅ Проверьте, что файлы добавлены в git (`git status`)
- ✅ Проверьте статус деплоя на GitHub Actions

---

## 📌 Быстрая шпаргалка

```
1. npm run process-lectures    ← Обработать материалы
2. git add src/data/            ← Добавить в Git
3. git commit -m "..."          ← Закоммитить
4. git push origin main          ← Отправить на GitHub
```

Готово! 🎉

