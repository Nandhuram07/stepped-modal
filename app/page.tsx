"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SteppedModal } from "@/components/ui/stepped-modal"
import { cn } from "@/lib/utils"

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
function FieldError({ message }: { message: string }) {
  if (!message) return null
  return (
    <p role="alert" className="text-destructive mt-2 text-sm">
      {message}
    </p>
  )
}

/* 1. Default variant: sync validation on two steps */
function CreateProject() {
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [plan, setPlan] = React.useState<"Free" | "Pro" | null>(null)
  const [error, setError] = React.useState("")

  const fail = (message: string) => {
    setError(message)
    return false
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Create project</Button>
      <SteppedModal
        open={open}
        onOpenChange={setOpen}
        onFinish={async () => {
          await sleep(600)
          setName("")
          setPlan(null)
        }}
        steps={[
          {
            id: "details",
            title: "Name your project",
            description: "You can rename it later.",
            validate: () =>
              name.trim().length >= 3
                ? (setError(""), true)
                : fail("Use at least 3 characters."),
          },
          {
            id: "plan",
            title: "Pick a plan",
            validate: () =>
              plan ? (setError(""), true) : fail("Choose a plan to continue."),
          },
          { id: "confirm", title: "Ready to create" },
        ]}
      >
        <SteppedModal.Header />
        <SteppedModal.Steps>
          <SteppedModal.Step id="details">
            <Label htmlFor="project-name">Project name</Label>
            <Input
              id="project-name"
              className="mt-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <FieldError message={error} />
          </SteppedModal.Step>

          <SteppedModal.Step id="plan">
            <div className="grid grid-cols-2 gap-3">
              {(["Free", "Pro"] as const).map((p) => (
                <Button
                  key={p}
                  type="button"
                  variant="outline"
                  aria-pressed={plan === p}
                  onClick={() => setPlan(p)}
                  className={cn(
                    "h-20 text-base",
                    plan === p && "border-primary bg-primary/10"
                  )}
                >
                  {p}
                </Button>
              ))}
            </div>
            <FieldError message={error} />
          </SteppedModal.Step>

          <SteppedModal.Step id="confirm">
            <p className="text-sm">
              <strong>{name}</strong> will be created on the{" "}
              <strong>{plan}</strong> plan.
            </p>
          </SteppedModal.Step>
        </SteppedModal.Steps>
        <SteppedModal.Footer finishLabel="Create project" />
      </SteppedModal>
    </>
  )
}

/* 2. Success variant: async validation (the button shows a busy state) */
function PublishSite() {
  const [open, setOpen] = React.useState(false)
  const [domain, setDomain] = React.useState("")
  const [error, setError] = React.useState("")

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Publish site
      </Button>
      <SteppedModal
        variant="success"
        open={open}
        onOpenChange={setOpen}
        onFinish={() => sleep(600)}
        steps={[
          {
            id: "domain",
            title: "Choose a domain",
            description: "Try “demo” to see the taken-name error.",
            validate: async () => {
              await sleep(800) // pretend to ask a server
              if (!domain.trim()) {
                setError("Enter a domain name.")
                return false
              }
              if (domain.trim() === "demo") {
                setError("That name is taken. Try another.")
                return false
              }
              setError("")
              return true
            },
          },
          { id: "review", title: "Review and publish" },
        ]}
      >
        <SteppedModal.Header />
        <SteppedModal.Steps>
          <SteppedModal.Step id="domain">
            <Label htmlFor="domain">Domain</Label>
            <Input
              id="domain"
              className="mt-2"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="my-site"
            />
            <FieldError message={error} />
          </SteppedModal.Step>
          <SteppedModal.Step id="review">
            <p className="text-sm">
              Your site will go live at <strong>{domain}.example.com</strong>.
            </p>
          </SteppedModal.Step>
        </SteppedModal.Steps>
        <SteppedModal.Footer finishLabel="Publish" />
      </SteppedModal>
    </>
  )
}

/* 3. Danger variant: type-to-confirm */
function DeleteWorkspace() {
  const [open, setOpen] = React.useState(false)
  const [typed, setTyped] = React.useState("")
  const [error, setError] = React.useState("")
  const workspace = "acme"

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Delete workspace
      </Button>
      <SteppedModal
        variant="danger"
        open={open}
        onOpenChange={setOpen}
        onFinish={async () => {
          await sleep(600)
          setTyped("")
        }}
        steps={[
          { id: "warning", title: "Delete this workspace?" },
          {
            id: "confirm",
            title: "Confirm deletion",
            validate: () =>
              typed === workspace
                ? (setError(""), true)
                : (setError(`Type “${workspace}” exactly as shown.`), false),
          },
        ]}
      >
        <SteppedModal.Header />
        <SteppedModal.Steps>
          <SteppedModal.Step id="warning">
            <p className="text-sm">
              All projects, members, and files in <strong>{workspace}</strong>{" "}
              will be permanently deleted. This can’t be undone.
            </p>
          </SteppedModal.Step>
          <SteppedModal.Step id="confirm">
            <Label htmlFor="confirm-name">
              Type <strong>{workspace}</strong> to confirm
            </Label>
            <Input
              id="confirm-name"
              className="mt-2"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
            />
            <FieldError message={error} />
          </SteppedModal.Step>
        </SteppedModal.Steps>
        <SteppedModal.Footer nextLabel="Continue" finishLabel="Delete workspace" />
      </SteppedModal>
    </>
  )
}

export default function Page() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Stepped Modal</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          A dialog on desktop and a draggable drawer on phones. Resize the
          window below 768px to switch.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <CreateProject />
        <PublishSite />
        <DeleteWorkspace />
      </div>
    </main>
  )
}
