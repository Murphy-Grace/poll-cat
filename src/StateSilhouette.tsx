import { useLayoutEffect, useRef, useState } from 'react'
import usaMap from '@svg-maps/usa'
export function StateSilhouette({ code, color }: { code: string; color: string }) {
  const location = usaMap.locations.find((l: { id: string; path: string }) => l.id === code.toLowerCase())
  const path = useRef<SVGPathElement>(null)
  const [box, setBox] = useState(usaMap.viewBox)
  useLayoutEffect(() => {
    if (!path.current) return
    const b = path.current.getBBox()
    if (b.width && b.height) setBox(`${b.x - 3} ${b.y - 3} ${b.width + 6} ${b.height + 6}`)
  }, [code])
  return location ? <svg className="state-silhouette" viewBox={box} aria-hidden="true"><path ref={path} d={location.path} fill={color}/></svg> : <span className="state-silhouette" aria-hidden="true">{code}</span>
}
