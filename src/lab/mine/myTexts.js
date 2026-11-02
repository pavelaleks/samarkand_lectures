/** Библиотека «Мои тексты»: общая для всех стендов, хранится только в этом браузере. */
import { useSyncExternalStore } from 'react'

const KEY = 'dh-my-texts-v1'
let texts = load()
let persisted = true
const subs = new Set()

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr.filter((t) => t && typeof t.text === 'string') : []
  } catch {
    return []
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(texts))
    persisted = true
  } catch {
    persisted = false
  }
  subs.forEach((f) => f())
}

function uniqueName(name) {
  const base = (name || 'Текст').trim().slice(0, 80) || 'Текст'
  let n = base
  let i = 2
  while (texts.some((t) => t.name === n)) n = `${base} (${i++})`
  return n
}

export function addText(name, text) {
  const clean = (text || '').replace(/\r\n?/g, '\n').trim()
  if (!clean) return null
  const item = { id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, name: uniqueName(name), text: clean }
  texts = [...texts, item]
  save()
  return item
}

export function removeText(id) {
  texts = texts.filter((t) => t.id !== id)
  save()
}

export function renameText(id, name) {
  texts = texts.map((t) => (t.id === id ? { ...t, name: name.trim() || t.name } : t))
  save()
}

export function clearTexts() {
  texts = []
  save()
}

const snapshot = () => texts
const subscribe = (f) => {
  subs.add(f)
  const onStorage = (e) => {
    if (e.key === KEY) {
      texts = load()
      f()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    subs.delete(f)
    window.removeEventListener('storage', onStorage)
  }
}

export function useMyTexts() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}

export const isPersisted = () => persisted
