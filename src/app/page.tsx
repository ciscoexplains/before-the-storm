import { createClient } from '@/utils/supabase/server'
import ClientHome from '@/components/ClientHome'
import JulianDashboard from '@/components/JulianDashboard'
import LandingPage from '@/components/LandingPage'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <LandingPage />
  }

  // Route Julian to his support dashboard
  const isJulian = user.email === 'julian@beforethestorm.com'

  if (isJulian) {
    return <JulianDashboard user={user} />
  }

  return <ClientHome user={user} />
}
