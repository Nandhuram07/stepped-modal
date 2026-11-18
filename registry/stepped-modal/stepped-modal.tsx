"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useStepper, type StepConfig } from "@/hooks/use-stepper"

type SteppedModalContextValue = ReturnType<typeof useStepper> & {
  steps: StepConfig[]
  isDesktop: boolean
  offset: { x: number; y: number }
  setOffset: (o: { x: number; y: number }) => void
}

const SteppedModalContext = React.createContext<SteppedModalContextValue | null>(
  null
)

export function useSteppedModal() {
  const ctx = React.useContext(SteppedModalContext)
  if (!ctx) {
    throw new Error("useSteppedModal must be used inside <SteppedModal>")
  }
  return ctx
}

type Variant = "default" | "success" | "danger"

/**
 * Each variant only sets one CSS variable. Progress bar and primary button read it,
 * so adding a variant is one line. Override --success in your globals.css to retheme.
 */
const accentByVariant: Record<Variant, string> = {
  default: "[--stepped-accent:var(--primary)]",
  success: "[--stepped-accent:var(--success,oklch(0.6_0.15_150))]",
  danger: "[--stepped-accent:var(--destructive)]",
}

type SteppedModalProps = {
  variant?: Variant
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Declared up front so the header and footer are correct on first paint. */
  steps: StepConfig[]
  /** Runs when the last step's Finish is pressed. The modal closes afterwards. */
  onFinish?: () => void | Promise<void>
  /** Width in px at which it switches from Drawer to Dialog. */
  breakpoint?: number
  className?: string
  children: React.ReactNode
}

function SteppedModal({
  variant = "default",
  open,
  onOpenChange,
  steps,
  onFinish,
  breakpoint = 768,
  className,
  children,
}: SteppedModalProps) {
  const isDesktop = useMediaQuery(`(min-width: ${breakpoint}px)`)

  const stepper = useStepper(steps, async () => {
    await onFinish?.()
    onOpenChange(false)
  })
  const { reset } = stepper
  const [offset, setOffset] = React.useState({ x: 0, y: 0 })

  // Reset after the close animation, so content doesn't flip to step 1 mid-fade.
  React.useEffect(() => {
  if (open) return
  const t = setTimeout(() => {
    reset()
    setOffset({ x: 0, y: 0 })
  }, 300)
  return () => clearTimeout(t)
  }, [open, reset])

const value: SteppedModalContextValue = { ...stepper, steps, isDesktop, offset, setOffset }
  return (
    <SteppedModalContext.Provider value={value}>
      {isDesktop ? (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent style={{ marginLeft: offset.x, marginTop: offset.y }}
            className={cn(
              "flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg",
              accentByVariant[variant],
              className
            )}
          >
            {children}
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent
            className={cn("max-h-[92dvh]", accentByVariant[variant], className)}
          >
            {children}
          </DrawerContent>
        </Drawer>
      )}
    </SteppedModalContext.Provider>
  )
}

function Header({ className }: { className?: string }) {
  //const { step, index, steps, isDesktop } = useSteppedModal()
  const { step, index, steps, isDesktop, offset, setOffset } = useSteppedModal()
   
  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
  if (!isDesktop || e.button !== 0) return
  const el = e.currentTarget
  const dialog = el.closest('[role="dialog"]')
  if (!dialog) return

  const rect = dialog.getBoundingClientRect()
  const start = { px: e.clientX, py: e.clientY, x: offset.x, y: offset.y }

  // How far the dialog can move from where it is now before an edge hits the viewport.
  const minX = start.x - rect.left
  const maxX = start.x + (window.innerWidth - rect.right)
  const minY = start.y - rect.top
  const maxY = start.y + (window.innerHeight - rect.bottom)

  el.setPointerCapture(e.pointerId)
  const move = (ev: PointerEvent) =>
    setOffset({
      x: Math.min(Math.max(start.x + ev.clientX - start.px, minX), maxX),
      y: Math.min(Math.max(start.y + ev.clientY - start.py, minY), maxY),
    })
  const up = () => {
    el.removeEventListener("pointermove", move)
    el.removeEventListener("pointerup", up)
  }
  el.addEventListener("pointermove", move)
  el.addEventListener("pointerup", up)
}

  const Head = isDesktop ? DialogHeader : DrawerHeader
  const Title = isDesktop ? DialogTitle : DrawerTitle
  const Description = isDesktop ? DialogDescription : DrawerDescription

  return (
    //<Head className={cn("px-6 pt-6 pb-4", className)}>
    <Head
        onPointerDown={onPointerDown}
        className={cn(
          "px-6 pt-6 pb-4",
          isDesktop && "cursor-grab touch-none select-none active:cursor-grabbing",
          className
        )}
      >
      {/* Inner wrapper keeps text left-aligned; Drawer headers centre by default. */}
      <div className="text-left">
        <p className="text-muted-foreground text-sm">
          Step {index + 1} of {steps.length}
        </p>
        <Title>{step.title}</Title>
        <Description className={cn(!step.description && "sr-only")}>
          {step.description ?? `Step ${index + 1} of ${steps.length}`}
        </Description>
      </div>
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-valuenow={index + 1}
        className="mt-3 flex gap-1.5"
      >
        {steps.map((s, i) => (
          <span
            key={s.id}
            className={cn(
              "bg-muted h-1 flex-1 rounded-full transition-colors",
              i <= index && "bg-[var(--stepped-accent)]"
            )}
          />
        ))}
      </div>
    </Head>
  )
}

function Steps({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const { step, direction } = useSteppedModal()
  const innerRef = React.useRef<HTMLDivElement>(null)
  const [height, setHeight] = React.useState<number>()

  // Measure the active step and animate the outer box to match, so the modal
  // grows or shrinks smoothly instead of jumping between steps.
  React.useEffect(() => {
    const el = innerRef.current
    if (!el) return
    setHeight(el.offsetHeight)
    const observer = new ResizeObserver(() => setHeight(el.offsetHeight))
    observer.observe(el)
    return () => observer.disconnect()
  }, [step.id])

  return (
    <div
      style={{ height }}
      className="min-h-0 overflow-x-hidden overflow-y-auto transition-[height] duration-200 motion-reduce:transition-none"
    >
      {/* key remounts on step change, which replays the direction-aware entrance. */}
      <div
        ref={innerRef}
        key={step.id}
        className={cn(
          "animate-in fade-in-0 px-6 pb-4 duration-200 motion-reduce:animate-none",
          direction === 1 ? "slide-in-from-right-6" : "slide-in-from-left-6",
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}

function Step({ id, children }: { id: string; children: React.ReactNode }) {
  const { step } = useSteppedModal()
  return step.id === id ? <>{children}</> : null
}

function Footer({
  className,
  backLabel = "Back",
  nextLabel = "Next",
  finishLabel = "Finish",
}: {
  className?: string
  backLabel?: string
  nextLabel?: string
  finishLabel?: string
}) {
  const { isFirst, isLast, busy, next, back } = useSteppedModal()

  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 border-t px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end",
        className
      )}
    >
      {!isFirst && (
        <Button type="button" variant="outline" onClick={back} disabled={busy}>
          {backLabel}
        </Button>
      )}
      <Button
        type="button"
        onClick={next}
        disabled={busy}
        className="bg-[var(--stepped-accent)] hover:bg-[var(--stepped-accent)] hover:brightness-110"
      >
        {isLast ? finishLabel : nextLabel}
      </Button>
    </div>
  )
}

const SteppedModalRoot = Object.assign(SteppedModal, {
  Header,
  Steps,
  Step,
  Footer,
})

export { SteppedModalRoot as SteppedModal }
export type { StepConfig }
