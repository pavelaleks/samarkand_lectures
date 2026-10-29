import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/**
 * Живая карта OpenStreetMap (Leaflet) с маркерами топосов.
 * points: { id, lat, lon, label, color, popupHtml }
 */
export default function LiveOsmMap({ points = [], height = 420 }) {
  const boxRef = useRef(null)
  const mapRef = useRef(null)
  const layerRef = useRef(null)

  useEffect(() => {
    if (!boxRef.current || mapRef.current) return
    const map = L.map(boxRef.current, {
      scrollWheelZoom: false,
      worldCopyJump: true,
    }).setView([48, 30], 4)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    const onResize = () => map.invalidateSize()
    window.addEventListener('resize', onResize)
    setTimeout(() => map.invalidateSize(), 80)
    return () => {
      window.removeEventListener('resize', onResize)
      map.remove()
      mapRef.current = null
      layerRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return
    layer.clearLayers()
    const pts = (points || []).filter((p) => Number.isFinite(+p.lat) && Number.isFinite(+p.lon))
    if (!pts.length) {
      map.setView([48, 30], 4)
      return
    }
    const bounds = []
    for (const p of pts) {
      const color = p.color || '#0d9488'
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:16px;height:16px;border-radius:999px;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.45)"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      })
      const m = L.marker([+p.lat, +p.lon], { icon })
      if (p.popupHtml) m.bindPopup(p.popupHtml, { maxWidth: 320 })
      else if (p.label) m.bindPopup(p.label)
      m.addTo(layer)
      bounds.push([+p.lat, +p.lon])
    }
    if (bounds.length === 1) map.setView(bounds[0], 6)
    else map.fitBounds(bounds, { padding: [36, 36], maxZoom: 6 })
    setTimeout(() => map.invalidateSize(), 50)
  }, [points])

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
      <div ref={boxRef} style={{ height, width: '100%', zIndex: 0 }} />
    </div>
  )
}
