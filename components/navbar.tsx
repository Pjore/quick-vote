import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "./mode-toggle"

export function Navbar() {
  return (
    <header className="border-b">
      <div className="container flex items-center justify-between h-16 px-4 mx-auto">
        <Link href="/" className="text-xl font-bold">
          Lightning Talks
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/my-topics">
            <Button variant="ghost">My Topics</Button>
          </Link>
          <Link href="/my-votes">
            <Button variant="ghost">My Votes</Button>
          </Link>
          <Link href="/add-topic">
            <Button>Add Topic</Button>
          </Link>
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
