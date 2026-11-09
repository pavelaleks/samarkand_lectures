import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { YM_ID } from '../config/analytics'

let loaded = false
function load() {
  if (loaded || !YM_ID || typeof window === 'undefined') return
  loaded = true
  /* Официальный код Яндекс Метрики (tag.js) */
  window.ym =
    window.ym ||
    function ym() {
      ;(window.ym.a = window.ym.a || []).push(arguments)
    }
  window.ym.l = Date.now()
  const s = document.createElement('script')
  s.async = true
  s.src = 'https://mc.yandex.ru/metrika/tag.js'
  document.head.appendChild(s)
  window.ym(YM_ID, 'init', {
    defer: true, // просмотры отправляем сами при каждой смене страницы (сайт одностраничный)
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
  })
}

/** Отправить просмотр страницы (в том числе смену вкладки кабинета). */
export function ymHit(url, title) {
  if (!YM_ID || typeof window === 'undefined' || !window.ym) return
  window.ym(YM_ID, 'hit', url || window.location.href, { title: title || document.title, referer: document.referrer })
}

/** Счётчик посещений: подключается один раз и считает переходы между страницами сайта. */
export default function Metrika() {
  const loc = useLocation()
  const prev = useRef(null)
  useEffect(() => {
    if (!YM_ID) return
    load()
    const url = window.location.href
    if (prev.current === url) return
    const referer = prev.current || document.referrer
    prev.current = url
    // даём странице выставить заголовок
    const t = setTimeout(() => window.ym && window.ym(YM_ID, 'hit', url, { title: document.title, referer }), 300)
    return () => clearTimeout(t)
  }, [loc.pathname, loc.search])
  return null
}
