import { logOut } from '@/actions/auth'
import { createSupabaseClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import React from 'react'

const Profile = async () => {
  const supabase = await createSupabaseClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error) redirect('/error')
  return (
    <main className="flex items-center justify-center min-h-screen">
      <form className="flex flex-col gap-5 w-1/4">
        <h1 className="text-3xl font-bold">Profile: {user?.email}</h1>
        <button
          formAction={logOut}
          className="p-2 bg-red-800 h-10 pointer hover:bg-red-700 transition-all rounded-sm flex items-center justify-center text-white font-bold w-full"
        >
          Log out
        </button>
      </form>
    </main>
  )
}

export default Profile
