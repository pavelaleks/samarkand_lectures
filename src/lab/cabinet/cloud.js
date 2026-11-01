/**
 * Облачное хранение кабинета. Два независимых способа:
 *  - Supabase: вход по почте и паролю, данные в таблице `cabinets` (REST API, без библиотек);
 *  - Firebase: вход через Google, данные в Firestore (официальный SDK грузится с gstatic.com по требованию).
 * В облако кладётся { profile, list, savedAt }. Аннотации укорачиваются, чтобы документ оставался небольшим.
 */
import { FIREBASE, SUPABASE } from '../../data/cloudConfig'

export const packForCloud = (profile, list) => ({
  profile: { ...profile, openAlexKey: '' }, // ключ OpenAlex остаётся только в браузере
  list: list.map((i) => ({ ...i, abstract: (i.abstract || '').slice(0, 600) })),
  savedAt: new Date().toISOString(),
})

const readLS = (k) => {
  try {
    return JSON.parse(localStorage.getItem(k) || 'null')
  } catch {
    return null
  }
}
const writeLS = (k, v) => {
  try {
    v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v))
  } catch {
    /* приватный режим */
  }
}

// ---------------------------------------------------------------- Supabase (почта + пароль)
const SB_SESSION = 'dh_cab_sb_session'

async function sbFetch(path, { method = 'GET', body, token, headers = {} } = {}) {
  const res = await fetch(`${SUPABASE.url.replace(/\/$/, '')}${path}`, {
    method,
    headers: {
      apikey: SUPABASE.anonKey,
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  if (!res.ok) {
    const m = data?.msg || data?.error_description || data?.message || data?.error || `HTTP ${res.status}`
    throw new Error(ruAuthError(String(m)))
  }
  return data
}

function ruAuthError(m) {
  if (/invalid login credentials/i.test(m)) return 'Неверная почта или пароль.'
  if (/already registered|already exists/i.test(m)) return 'Эта почта уже зарегистрирована — нажмите «Войти».'
  if (/password should be at least/i.test(m)) return 'Пароль слишком короткий (нужно не меньше 6 символов).'
  if (/email not confirmed/i.test(m)) return 'Почта не подтверждена: откройте письмо от Supabase и перейдите по ссылке.'
  if (/rate limit/i.test(m)) return 'Слишком много попыток. Подождите несколько минут.'
  if (/invalid.*email|unable to validate email/i.test(m)) return 'Проверьте адрес почты.'
  return m
}

function sbSave(s) {
  if (!s?.access_token) return null
  const session = {
    access_token: s.access_token,
    refresh_token: s.refresh_token,
    expires_at: Date.now() + (s.expires_in || 3600) * 1000,
    user: { id: s.user?.id, email: s.user?.email },
  }
  writeLS(SB_SESSION, session)
  return session
}

async function sbToken() {
  let s = readLS(SB_SESSION)
  if (!s) return null
  if (s.expires_at - Date.now() < 60_000) {
    try {
      s = sbSave(await sbFetch('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: s.refresh_token } }))
    } catch {
      writeLS(SB_SESSION, null)
      return null
    }
  }
  return s
}

export const supabaseProvider = {
  id: 'supabase',
  configured: () => Boolean(SUPABASE.url && SUPABASE.anonKey),
  async current() {
    const s = await sbToken()
    return s ? { id: s.user.id, email: s.user.email } : null
  },
  async signUp(email, password) {
    const d = await sbFetch('/auth/v1/signup', { method: 'POST', body: { email, password } })
    const s = sbSave(d?.access_token ? d : d?.session)
    if (!s) return { needConfirm: true }
    return { user: s.user }
  },
  async signIn(email, password) {
    const s = sbSave(await sbFetch('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } }))
    return { user: s.user }
  },
  async resetPassword(email) {
    await sbFetch('/auth/v1/recover', { method: 'POST', body: { email } })
  },
  async signOut() {
    const s = readLS(SB_SESSION)
    writeLS(SB_SESSION, null)
    if (s?.access_token) await sbFetch('/auth/v1/logout', { method: 'POST', token: s.access_token }).catch(() => {})
  },
  async load() {
    const s = await sbToken()
    if (!s) throw new Error('Войдите заново.')
    const rows = await sbFetch(`/rest/v1/cabinets?select=data,updated_at&user_id=eq.${s.user.id}`, { token: s.access_token })
    return rows?.[0]?.data || null
  },
  async save(data) {
    const s = await sbToken()
    if (!s) throw new Error('Войдите заново.')
    await sbFetch('/rest/v1/cabinets', {
      method: 'POST',
      token: s.access_token,
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: { user_id: s.user.id, data, updated_at: new Date().toISOString() },
    })
  },
}

// ---------------------------------------------------------------- Firebase (вход через Google)
const FB_VER = '10.12.2'
let fb = null

async function firebase() {
  if (fb) return fb
  const base = `https://www.gstatic.com/firebasejs/${FB_VER}`
  const [appM, authM, fsM] = await Promise.all([
    import(/* @vite-ignore */ `${base}/firebase-app.js`),
    import(/* @vite-ignore */ `${base}/firebase-auth.js`),
    import(/* @vite-ignore */ `${base}/firebase-firestore.js`),
  ])
  const app = appM.getApps().length ? appM.getApp() : appM.initializeApp(FIREBASE)
  const auth = authM.getAuth(app)
  const db = fsM.getFirestore(app)
  const ready = new Promise((resolve) => {
    const off = authM.onAuthStateChanged(auth, (u) => {
      off()
      resolve(u)
    })
  })
  fb = { authM, fsM, auth, db, ready }
  return fb
}

export const firebaseProvider = {
  id: 'firebase',
  configured: () => Boolean(FIREBASE.apiKey && FIREBASE.projectId),
  async current() {
    const { auth, ready } = await firebase()
    await ready
    const u = auth.currentUser
    return u ? { id: u.uid, email: u.email, name: u.displayName } : null
  },
  async signInGoogle() {
    const { authM, auth } = await firebase()
    try {
      const r = await authM.signInWithPopup(auth, new authM.GoogleAuthProvider())
      return { user: { id: r.user.uid, email: r.user.email, name: r.user.displayName } }
    } catch (e) {
      if (/popup-closed|cancelled-popup/.test(e.code || '')) throw new Error('Окно входа закрыто.')
      if (/popup-blocked/.test(e.code || '')) throw new Error('Браузер заблокировал окно входа — разрешите всплывающие окна для сайта.')
      if (/unauthorized-domain/.test(e.code || '')) throw new Error('Домен сайта не добавлен в Firebase (Authentication → Settings → Authorized domains).')
      throw new Error(e.message || 'Не удалось войти через Google.')
    }
  },
  async signOut() {
    const { authM, auth } = await firebase()
    await authM.signOut(auth)
  },
  async load() {
    const { fsM, db, auth } = await firebase()
    const u = auth.currentUser
    if (!u) throw new Error('Войдите заново.')
    const snap = await fsM.getDoc(fsM.doc(db, 'cabinets', u.uid))
    if (!snap.exists()) return null
    const v = snap.data()
    return v?.json ? JSON.parse(v.json) : null
  },
  async save(data) {
    const { fsM, db, auth } = await firebase()
    const u = auth.currentUser
    if (!u) throw new Error('Войдите заново.')
    await fsM.setDoc(fsM.doc(db, 'cabinets', u.uid), { json: JSON.stringify(data), updatedAt: new Date().toISOString(), email: u.email || '' })
  },
}

export const PROVIDERS = { supabase: supabaseProvider, firebase: firebaseProvider }

/** Объединение двух кабинетов: профиль — более заполненный, списки — без повторов. */
export function mergeCabinets(a, b) {
  const filled = (p) => Object.values(p || {}).filter((v) => (Array.isArray(v) ? v.length : v)).length
  const profile = filled(a?.profile) >= filled(b?.profile) ? a?.profile : b?.profile
  const map = new Map()
  for (const i of [...(a?.list || []), ...(b?.list || [])]) {
    const prev = map.get(i.key)
    map.set(i.key, prev ? { ...i, ...prev, note: prev.note || i.note } : i)
  }
  return { profile, list: [...map.values()] }
}
