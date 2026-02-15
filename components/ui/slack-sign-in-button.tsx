import * as React from "react"
import { cn } from "@/lib/utils"

interface SlackSignInButtonProps
  extends Omit<React.ComponentProps<"button">, "children"> {
  loading?: boolean
}

function SlackSignInButton({
  className,
  loading = false,
  disabled,
  ...props
}: SlackSignInButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        // Layout
        "inline-flex items-center justify-center gap-3",
        // Sizing — Slack default: 256×48, 16px bold
        "h-12 min-w-[256px] px-4",
        // Typography — Slack official: Lato 600, 16px
        "text-base font-semibold",
        "font-['Lato',_sans-serif]",
        // Colors — Slack light theme: white bg, black text, grey border
        "bg-white text-[#000000] border border-[#DDDDDD]",
        // Shape — Slack minimum border-radius: 4px
        "rounded",
        // Hover
        "hover:shadow-md hover:border-[#CCCCCC]",
        // Focus ring (accessible)
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1264A3] focus-visible:ring-offset-2",
        // Active
        "active:bg-[#F5F5F5]",
        // Disabled
        "disabled:opacity-50 disabled:pointer-events-none",
        // Transition
        "transition-all duration-150 ease-in-out",
        "cursor-pointer",
        className
      )}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin size-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="size-5 shrink-0"
          viewBox="0 0 122.8 122.8"
          aria-hidden="true"
        >
          <path
            d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9zm6.5 0c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z"
            fill="#e01e5a"
          />
          <path
            d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2zm0 6.5c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z"
            fill="#36c5f0"
          />
          <path
            d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2zm-6.5 0c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C64.7 5.8 70.5 0 77.6 0s12.9 5.8 12.9 12.9v32.3z"
            fill="#2eb67d"
          />
          <path
            d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9zm0-6.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z"
            fill="#ecb22e"
          />
        </svg>
      )}
      <span>Sign in with Slack</span>
    </button>
  )
}

export { SlackSignInButton }
export type { SlackSignInButtonProps }
