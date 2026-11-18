import * as React from "react"

export type StepConfig = {
  id: string
  title: string
  description?: string
  /** Return false to block moving forward. Can be async. */
  validate?: () => boolean | Promise<boolean>
}

export function useStepper(
  steps: StepConfig[],
  onFinish?: () => void | Promise<void>
) {
  const [index, setIndex] = React.useState(0)
  const [direction, setDirection] = React.useState<1 | -1>(1)
  const [busy, setBusy] = React.useState(false)

  const last = steps.length - 1

  const move = React.useCallback(
    (to: number) => {
      const target = Math.min(Math.max(to, 0), last)
      if (target === index) return
      setDirection(target > index ? 1 : -1)
      setIndex(target)
    },
    [index, last]
  )

  const next = React.useCallback(async () => {
    if (busy) return
    setBusy(true)
    try {
      const validate = steps[index]?.validate
      if (validate && !(await validate())) return
      if (index === last) {
        await onFinish?.()
        return
      }
      move(index + 1)
    } finally {
      setBusy(false)
    }
  }, [busy, index, last, move, onFinish, steps])

  const back = React.useCallback(() => move(index - 1), [move, index])

  /** Jump to an earlier step. Forward jumps go through next() so validation runs. */
  const goTo = React.useCallback(
    (id: string) => {
      const target = steps.findIndex((s) => s.id === id)
      if (target !== -1 && target < index) move(target)
    },
    [steps, index, move]
  )

  const reset = React.useCallback(() => {
    setIndex(0)
    setDirection(1)
    setBusy(false)
  }, [])

  return {
    index,
    step: steps[index],
    direction,
    busy,
    isFirst: index === 0,
    isLast: index === last,
    next,
    back,
    goTo,
    reset,
  }
}
