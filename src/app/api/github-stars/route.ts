import { NextResponse } from 'next/server'
import projectsConfig from '@/content/projects'

// Always compute at request time; rely on fetch-level caching instead
export const dynamic = 'force-dynamic'

export async function GET() {
  const repos = projectsConfig.items
    .map((p) => p.github)
    .filter((v) => v !== null) as string[]

  const uniqueRepos = Array.from(new Set(repos))

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'nextjs-portfoliosite',
  }

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }

  // Pre-populate with zeros so the client never gets an empty map
  const results: Record<string, number> = Object.fromEntries(
    uniqueRepos.map((r) => [r, 0])
  )
  let failures = 0

  await Promise.all(
    uniqueRepos.map(async (repo) => {
      try {
        const res = await fetch(`https://api.github.com/repos/${repo}`, {
          headers,
          next: { revalidate: 3600 },
        })

        if (!res.ok) {
          failures += 1
          return
        }

        const data = await res.json()
        const count = data?.stargazers_count
        if (typeof count === 'number') {
          results[repo] = count
        }
      } catch {
        failures += 1
      }
    })
  )

  return NextResponse.json(
    { stars: results },
    {
      headers: {
        'Cache-Control': 'no-store',
        'X-GitHub-Failures': String(failures),
      },
    }
  )
}
