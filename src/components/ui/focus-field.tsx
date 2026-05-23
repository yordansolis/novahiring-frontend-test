"use client"

import { useState, type ReactNode } from "react"
import { motion } from "framer-motion"

export function FocusField({ children }: { children: ReactNode }) {
  const [focused, setFocused] = useState(false)

  return (
    <motion.div
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      animate={{ y: focused ? -2 : 0 }}
      transition={{ type: "tween", duration: 0.18 }}
    >
      {children}
    </motion.div>
  )
}
