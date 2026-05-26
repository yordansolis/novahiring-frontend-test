import type { ComponentProps, HTMLAttributes } from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: "user" | "assistant"
}

export const Message = ({ className, from, ...props }: MessageProps) => (
  <div
    className={cn(
      "group flex w-full items-end justify-end gap-2 py-4",
      from === "user" ? "is-user" : "is-assistant flex-row-reverse justify-end",
      className
    )}
    {...props}
  />
)

const messageContentVariants = cva(
  "flex flex-col gap-2 overflow-hidden rounded-xl text-sm",
  {
    variants: {
      variant: {
        contained: [
          "max-w-[80%] px-4 py-3",
          // User: neutral surface + shadow that adapts to light/dark
          "group-[.is-user]:bg-[var(--ds-background-200)] group-[.is-user]:text-[var(--ds-gray-1000)]",
          "group-[.is-user]:shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.06)]",
          "dark:group-[.is-user]:shadow-[0_1px_4px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.22)]",
          "group-[.is-user]:ring-1 group-[.is-user]:ring-[var(--ds-border)]",
          // Assistant: elevated surface
          "group-[.is-assistant]:bg-[var(--ds-background-300)] group-[.is-assistant]:text-[var(--ds-gray-1000)]",
        ],
        flat: [
          "group-[.is-user]:max-w-[80%] group-[.is-user]:bg-[var(--ds-background-200)] group-[.is-user]:px-4 group-[.is-user]:py-3 group-[.is-user]:text-[var(--ds-gray-1000)]",
          "group-[.is-user]:shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.06)]",
          "dark:group-[.is-user]:shadow-[0_1px_4px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.22)]",
          "group-[.is-user]:ring-1 group-[.is-user]:ring-[var(--ds-border)]",
          "group-[.is-assistant]:text-[var(--ds-gray-1000)]",
        ],
      },
    },
    defaultVariants: {
      variant: "contained",
    },
  }
)

export type MessageContentProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof messageContentVariants>

export const MessageContent = ({
  children,
  className,
  variant,
  ...props
}: MessageContentProps) => (
  <div
    className={cn(messageContentVariants({ variant, className }))}
    {...props}
  >
    {children}
  </div>
)

export type MessageAvatarProps = ComponentProps<typeof Avatar> & {
  src: string
  name?: string
}

export const MessageAvatar = ({
  src,
  name,
  className,
  ...props
}: MessageAvatarProps) => (
  <Avatar className={cn("ring-border size-8 ring-1", className)} {...props}>
    <AvatarImage alt="" className="mt-0 mb-0" src={src} />
    <AvatarFallback>{name?.slice(0, 2) || "ME"}</AvatarFallback>
  </Avatar>
)
