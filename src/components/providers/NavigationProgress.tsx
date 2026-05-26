"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"

let _startFn: (() => void) | null = null

export function startProgress() {
  _startFn?.()
}

export function NavigationProgress() {
  const pathname = usePathname()
  const prevPathRef = useRef(pathname)
  const [pct, setPct] = useState(0)
  const [visible, setVisible] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeRef = useRef(false)

  // start progress on internal link click
  useEffect(() => {
    const start = () => {
      if (activeRef.current) return
      activeRef.current = true
      if (intervalRef.current !== null) { clearInterval(intervalRef.current); intervalRef.current = null }
      if (hideRef.current !== null) { clearTimeout(hideRef.current); hideRef.current = null }
      setVisible(true)
      setPct(4)
      let p = 4
      intervalRef.current = setInterval(() => {
        // fast early on, trickles as it approaches the cap
        p += p < 30 ? 5 : p < 60 ? 2 : p < 80 ? 0.8 : 0.15
        setPct(Math.min(p, 88))
      }, 80)
    }

    _startFn = start

    const handle = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a")
      if (a === null) return
      const href = a.getAttribute("href") ?? ""
      // only internal relative paths that differ from current
      if (!href.startsWith("/") || href === pathname) return
      start()
    }

    document.addEventListener("click", handle, { capture: true })
    return () => {
      document.removeEventListener("click", handle, { capture: true })
      _startFn = null
    }
  }, [pathname])

  // finish when pathname actually changes (navigation complete)
  useEffect(() => {
    if (pathname === prevPathRef.current) return
    prevPathRef.current = pathname
    activeRef.current = false
    if (intervalRef.current !== null) { clearInterval(intervalRef.current); intervalRef.current = null }
    if (hideRef.current !== null) { clearTimeout(hideRef.current); hideRef.current = null }
    setPct(100)
    hideRef.current = setTimeout(() => {
      setVisible(false)
      setPct(0)
    }, 360)
  }, [pathname])

  // cleanup on unmount
  useEffect(() => () => {
    if (intervalRef.current !== null) clearInterval(intervalRef.current)
    if (hideRef.current !== null) clearTimeout(hideRef.current)
  }, [])

  if (!visible) return null

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: 2,
        width: `${pct}%`,
        background: "var(--ds-accent-blue)",
        zIndex: 9999,
        transition: pct >= 100 ? "width 0.14s ease-out" : "width 0.08s linear",
        boxShadow: "0 0 8px 0 var(--ds-accent-blue)",
        pointerEvents: "none",
      }}
    />
  )
}
