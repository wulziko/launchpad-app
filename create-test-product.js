import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rxtcssesqwooggydfkvs.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4dGNzc2VzcXdvb2dneWRma3ZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU4NDg0NSwiZXhwIjoyMDg1MTYwODQ1fQ.m0HFvrjSXy9XpBJlk_TelO6xig3XqsHlJJnPQysytL4'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTestProduct() {
  try {
    // Get the user ID for guy@test.com
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers()
    
    if (userError) {
      console.error('Error fetching users:', userError.message)
      return
    }
    
    const user = userData.users.find(u => u.email === 'guy@test.com')
    
    if (!user) {
      console.error('User guy@test.com not found')
      return
    }
    
    console.log('Found user:', user.email, 'ID:', user.id)
    
    // Create the test product
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: 'Final QA Test Product',
        description: 'Testing all LaunchPad workflows',
        user_id: user.id,
        country: 'Israel',
        language: 'Hebrew',
        gender: 'Female',
        niche: 'Beauty & Health',
        product_image_url: 'https://www.glownow.ch/cdn/shop/files/glownow-cellulite-massagegerat.jpg?v=1736935738&width=990',
        status: 'new',
        metadata: {}
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating product:', error.message)
      return
    }
    
    console.log('✅ Test product created successfully!')
    console.log('Product ID:', data.id)
    console.log('Product Name:', data.name)
    console.log('Country:', data.country)
    console.log('Language:', data.language)
    console.log('Gender:', data.gender)
    console.log('Niche:', data.niche)
    console.log('\n🎯 Ready for QA testing!')
  } catch (err) {
    console.error('Unexpected error:', err.message)
  }
}

createTestProduct()
