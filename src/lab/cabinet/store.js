import { useEffect, useState } from 'react'

const read = (key, fallback) => {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch {
    return fallback
  }
}
const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* приватный режим — работаем без сохранения */
  }
}

/** Состояние, которое переживает перезагрузку страницы (хранится только в этом браузере). */
export function usePersistent(key, initial) {
  const [v, setV] = useState(() => read(key, initial))
  useEffect(() => write(key, v), [key, v])
  return [v, setV]
}

export const DEFAULT_GROUPS = ['Теория и методология', 'Об авторе', 'О произведении (материал)', 'Цифровые методы', 'Справочные издания']

export const EMPTY_PROFILE = {
  name: '',
  supervisor: '',
  topic: '',
  author: '',
  authorLatin: '',
  kwRu: '',
  kwEn: '',
  fromYear: '',
  toYear: '',
  groups: DEFAULT_GROUPS,
  openAlexKey: '',
}

export const EXAMPLE_PROFILE = {
  ...EMPTY_PROFILE,
  topic: 'Мотив памяти в цикле И. А. Бунина «Тёмные аллеи»',
  author: 'Иван Бунин',
  authorLatin: 'Ivan Bunin',
  kwRu: 'Бунин память; Тёмные аллеи; Бунин поэтика рассказа',
  kwEn: 'Bunin memory; Dark Avenues Bunin; Ivan Bunin short story; Russian emigre literature',
}
