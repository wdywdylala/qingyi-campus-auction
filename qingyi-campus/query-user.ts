import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yvcbjvbswsmwvrtibqmq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2Y2JqdmJzd3Ntd3ZydGlicW1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3Nzc0ODMsImV4cCI6MjA4MzM1MzQ4M30.3HJlE6Eo2fG4NPQgMcLIYsPNxSWRJ0Hbqqw5scxGqEA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function getUsernameByEmail() {
  const { data, error } = await supabase
    .from('profiles')
    .select('username, email')
    .eq('email', 'wdy3322933287@163.com')
    .single()

  if (error) {
    console.error('查询失败:', error.message)
    return
  }

  if (data) {
    console.log('查询结果:')
    console.log(`邮箱: ${data.email}`)
    console.log(`用户名: ${data.username}`)
  } else {
    console.log('未找到该邮箱对应的用户')
  }
}

getUsernameByEmail()
