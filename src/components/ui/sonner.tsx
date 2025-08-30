import { useEffect, useState } from "react"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

// Custom hook for system theme detection
const useSystemTheme = () => {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system")

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => {
      setTheme(mediaQuery.matches ? "dark" : "light")
    }
    
    // Set initial theme
    handleChange()
    
    // Listen for changes
    mediaQuery.addEventListener("change", handleChange)
    
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  return theme
}

const Toaster = ({ ...props }: ToasterProps) => {
  const theme = useSystemTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
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

export { Toaster, toast }
