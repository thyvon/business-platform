"use client"

import { Toaster as SonnerToaster } from "sonner"
import { useTheme } from "@/lib/theme-context"

type ToasterProps = React.ComponentProps<typeof SonnerToaster>

function Toaster({ ...props }: ToasterProps) {
  const { theme } = useTheme()

  return (
    <SonnerToaster
      theme={theme}
      position="top-center"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          success:
             "group-[.toast]:!bg-primary/10 group-[.toast]:!border-primary/30 group-[.toast]:!text-foreground [&_[data-icon]]:!text-primary",
          error:
             "group-[.toast]:!bg-destructive/10 group-[.toast]:!border-destructive/30 group-[.toast]:!text-foreground [&_[data-icon]]:!text-destructive",
          warning:
             "group-[.toast]:!bg-amber-50 group-[.toast]:!border-amber-300 group-[.toast]:!text-foreground [&_[data-icon]]:!text-amber-600 dark:group-[.toast]:!bg-amber-950/30 dark:group-[.toast]:!border-amber-700/50 dark:[&_[data-icon]]:!text-amber-400",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
