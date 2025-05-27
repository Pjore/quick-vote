import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Plus, Vote } from "lucide-react"

export function NavBar() {
  return (
    <nav className="border-b py-4 px-6 bg-background">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="font-bold text-xl">
          Lightning Talks
        </Link>

        <div className="flex gap-2">
          <Button variant="ghost" asChild>
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Link>
          </Button>

          <Button variant="ghost" asChild>
            <Link href="/vote">
              <Vote className="h-4 w-4 mr-2" />
              Vote
            </Link>
          </Button>

          <Button variant="default" asChild>
            <Link href="/add">
              <Plus className="h-4 w-4 mr-2" />
              Add Topic
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}
