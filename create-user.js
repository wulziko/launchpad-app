import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rxtcssesqwooggydfkvs.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4dGNzc2VzcXdvb2dneWRma3ZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU4NDg0NSwiZXhwIjoyMDg1MTYwODQ1fQ.m0HFvrjSXy9XpBJlk_TelO6xig3XqsHlJJnPQysytL4'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createUser() {
  try {
    // Try to create a user with admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'guy@test.com',
      password: '123123',
      email_confirm: true,
      user_metadata: {
        name: 'Guy Ma'
      }
    })

    if (error) {
      console.error('Error creating user:', error.message)
      return
    }

    console.log('✅ User created successfully:', data.user.email)
    console.log('User ID:', data.user.id)
    console.log('\nYou can now login with:')
    console.log('Email: guy@test.com')
    console.log('Password: 123123')
  } catch (err) {
    console.error('Unexpected error:', err.message)
  }
}

createUser()
