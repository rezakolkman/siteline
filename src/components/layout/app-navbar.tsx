import { SidebarTrigger } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

type AppNavbarProps = {
  title?: React.ReactNode
  actions?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export function AppNavbar({ title, actions, children, className }: AppNavbarProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4',
        className
      )}
    >
      <SidebarTrigger className="-ml-1 shrink-0" />
      <div className="flex min-w-0 flex-1 items-center gap-2 text-[15px]">
        {children ??
          (typeof title === 'string' ? (
            <h1 className="truncate font-semibold text-foreground">{title}</h1>
          ) : (
            title
          ))}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </header>
  )
}
