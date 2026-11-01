/**
 * Подключение облачного хранения «Кабинета магистранта».
 * Пока поля пустые, соответствующий способ в кабинете показан как «ещё не подключён».
 * Пошаговая инструкция: docs/CABINET_CLOUD_SETUP.md
 *
 * Эти значения НЕ секретные: они предназначены для браузера. Защиту данных обеспечивают
 * правила доступа (RLS в Supabase, Security Rules в Firebase) — каждый видит только свой кабинет.
 */

// Способ 2: аккаунт по почте и паролю (supabase.com → Project Settings → API)
export const SUPABASE = {
  url: '', // например: https://abcdefghijklmno.supabase.co
  anonKey: '', // «anon public» ключ
}

// Способ 3: вход через Google (console.firebase.google.com → Project settings → Your apps → Web app)
export const FIREBASE = {
  apiKey: '',
  authDomain: '', // например: samgu-dh-cabinet.firebaseapp.com
  projectId: '',
  appId: '',
}
