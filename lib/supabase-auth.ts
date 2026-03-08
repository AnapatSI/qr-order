import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey)

export async function signIn(email: string, password: string) {
  try {
    console.log('=== SIGN IN FUNCTION CALLED ===')
    console.log('Email:', email)
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    })
    
    console.log('=== SUPABASE RESPONSE ===')
    console.log('Data:', data)
    console.log('Error:', error)
    
    if (error) {
      console.error('Sign in error details:', error)
      return { data: null, error }
    }
    
    if (!data.user) {
      console.error('No user in response data')
      return { data: null, error: { message: 'No user returned' } }
    }
    
    console.log('User authenticated:', data.user.id)
    console.log('User email:', data.user.email)
    console.log('Session exists:', !!data.session)
    
    // Wait a moment for session to be established
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Verify session was established
    const { data: sessionData } = await supabaseAuth.auth.getSession()
    console.log('Session after sign in:', sessionData.session?.user?.id)
    
    return { data, error: null }
  } catch (err) {
    console.error('Sign in exception:', err)
    return { data: null, error: { message: 'An unexpected error occurred' } }
  }
}

export async function signOut() {
  const { error } = await supabaseAuth.auth.signOut()
  return { error }
}

export async function getSession() {
  const { data: { session } } = await supabaseAuth.auth.getSession()
  return session
}

export async function getUser() {
  const { data: { user } } = await supabaseAuth.auth.getUser()
  return user
}
