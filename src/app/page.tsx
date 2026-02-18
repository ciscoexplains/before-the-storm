import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import ClientHome from '@/components/ClientHome'
import LandingPage from '@/components/LandingPage'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <LandingPage />
  }

  return <ClientHome user={user} />
}
