"use client"

import { useTheme } from "next-themes"
import { X } from "lucide-react"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      closeButton
      icons={{
        close: <X className="h-3.5 w-3.5" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-bg-elevated group-[.toaster]:text-text-primary group-[.toaster]:border-border-subtle group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-text-secondary",
          closeButton:
            "group-[.toast]:border-border-subtle group-[.toast]:bg-bg-surface group-[.toast]:text-text-muted group-[.toast]:hover:bg-bg-highlight group-[.toast]:hover:text-text-primary",
          actionButton:
            "group-[.toast]:bg-accent-blue group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-bg-surface group-[.toast]:text-text-secondary",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
