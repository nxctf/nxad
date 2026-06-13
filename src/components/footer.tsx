import { Github, Globe } from "lucide-react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-900 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center space-y-3 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-400">
            <Link
              href="https://github.com/nxctf/nxad"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 hover:text-green-400 transition-colors"
            >
              <Github className="h-4 w-4" />
              <span className="font-medium">nxctf/nxad</span>
            </Link>
            <span className="text-gray-700 hidden sm:inline">|</span>
            <Link
              href="https://nxctf.my.id"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 hover:text-blue-400 transition-colors"
            >
              <Globe className="h-4 w-4" />
              <span className="font-medium">nxctf.my.id</span>
            </Link>
          </div>
          <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} NXAD. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
