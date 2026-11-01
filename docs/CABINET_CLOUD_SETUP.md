# Подключение облачного хранения «Кабинета магистранта»

В кабинете студент сам выбирает, где хранить тему и список литературы:

1. **Только в этом браузере + копия в файле / Zotero** — работает всегда, ничего настраивать не нужно.
2. **Аккаунт по почте и паролю** — сервис Supabase (бесплатный тариф).
3. **Аккаунт Google** — сервис Firebase (бесплатный тариф Spark).

Способы 2 и 3 включаются, когда в файле `src/data/cloudConfig.js` заполнены значения. Пока они пустые, студенты видят
эти способы с пометкой «ещё не подключён». Можно подключить только один из двух.

Значения из инструкции **не секретные** — они специально предназначены для браузера. Данные защищают правила доступа
(шаг «Правила» ниже): каждый студент читает и пишет только свой кабинет.

---

## Способ 2. Supabase — вход по почте и паролю (≈10 минут)

1. Зайдите на <https://supabase.com> → **Start your project** → войдите через GitHub (аккаунт `pavelaleks` подойдёт).
2. **New project**: имя `samgu-dh-cabinet`, придумайте пароль базы (сохраните его у себя), регион — *Central EU (Frankfurt)*,
   тариф **Free** → **Create new project**. Подождите 1–2 минуты.
3. Слева **SQL Editor** → **New query** → вставьте и нажмите **Run**:

   ```sql
   create table public.cabinets (
     user_id    uuid primary key references auth.users(id) on delete cascade,
     data       jsonb not null,
     updated_at timestamptz not null default now()
   );

   alter table public.cabinets enable row level security;

   create policy "свой кабинет: чтение"    on public.cabinets for select using (auth.uid() = user_id);
   create policy "свой кабинет: создание"  on public.cabinets for insert with check (auth.uid() = user_id);
   create policy "свой кабинет: изменение" on public.cabinets for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
   create policy "свой кабинет: удаление"  on public.cabinets for delete using (auth.uid() = user_id);
   ```

4. **Authentication → Sign In / Providers → Email**: выключите **Confirm email** → **Save**.
   *Зачем:* встроенная почта Supabase отправляет лишь несколько писем в час на весь проект; без подтверждения студенты
   регистрируются мгновенно, даже всей группой на паре.
5. **Authentication → URL Configuration → Site URL**: `https://pavelaleks.github.io/samarkand_lectures/` → **Save**
   (нужно для писем «забыли пароль»).
6. **Project Settings → API**: скопируйте **Project URL** и ключ **anon public**.
7. Пришлите оба значения Claude (или впишите сами в `src/data/cloudConfig.js` → `SUPABASE`).

**Посмотреть кабинеты студентов:** Supabase → **Table Editor → cabinets** (видит только владелец проекта). Если будете
так делать — предупредите магистрантов.

---

## Способ 3. Firebase — вход через Google (≈15 минут)

1. <https://console.firebase.google.com> → **Создать проект** → имя `samgu-dh-cabinet` → Google Analytics можно отключить.
2. **Build → Authentication → Get started → Sign-in method → Google** → включить, указать почту поддержки → **Save**.
3. **Authentication → Settings → Authorized domains → Add domain**: `pavelaleks.github.io`.
4. **Build → Firestore Database → Create database** → *Start in production mode* → регион `eur3 (europe-west)`.
5. Вкладка **Rules** → замените всё на это и нажмите **Publish**:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /cabinets/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```

6. **Project settings (шестерёнка) → General → Your apps → значок `</>`** → имя `cabinet` → **Register app**.
   Из показанного `firebaseConfig` нужны `apiKey`, `authDomain`, `projectId`, `appId`.
7. Пришлите их Claude (или впишите в `src/data/cloudConfig.js` → `FIREBASE`).

**Посмотреть кабинеты:** Firebase → **Firestore Database → cabinets** (документ на каждого студента, с его почтой).

---

## Как это работает

- После входа кабинет сверяет данные браузера и облака. Если в облаке другая версия, студент выбирает: объединить
  (по умолчанию), взять из облака или оставить свою.
- Дальше всё сохраняется автоматически через 1,5 секунды после изменений; статус виден рядом с темой («☁ сохранено 14:05»).
- В облако не отправляется ключ OpenAlex; аннотации укорачиваются до 600 знаков.
- Код: `src/lab/cabinet/cloud.js` (Supabase — через REST API без библиотек; Firebase — официальный SDK, загружается
  с gstatic.com только при выборе этого способа).
