import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  // Use environment variable for origin to avoid 0.0.0.0 issues on production
  const appOrigin = process.env.NEXT_PUBLIC_APP_URL || origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${appOrigin}${next}`)
    }
  }

  // Auth code exchange failed — redirect to error page
  return NextResponse.redirect(`${appOrigin}/auth/error`)
}
