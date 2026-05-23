import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-lg border border-input bg-transparent px-4 py-2.5 text-sm transition-all duration-200 outline-none placeholder:text-muted-foreground focus-visible:border-[var(--ds-accent-blue)] focus-visible:shadow-[0_0_0_3px_rgba(59,130,246,0.18),0_2px_8px_rgba(0,0,0,0.25)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-[var(--ds-accent-red)] aria-invalid:shadow-[0_0_0_3px_rgba(239,68,68,0.18)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
