import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    console.log('Dropping ledger table...')
    
    // Drop the ledger table
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'DROP TABLE IF EXISTS ledger;'
    })
    
    if (dropError) {
      console.error('Error dropping table:', dropError)
      return Response.json({ 
        success: false, 
        error: 'Failed to drop table: ' + dropError.message 
      }, { status: 500 })
    }
    
    console.log('Recreating ledger table...')
    
    // Recreate the ledger table
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE ledger (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          date DATE NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          description TEXT NOT NULL,
          category TEXT,
          source TEXT NOT NULL,
          vendor TEXT,
          pdf_path TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })
    
    if (createError) {
      console.error('Error creating table:', createError)
      return Response.json({ 
        success: false, 
        error: 'Failed to create table: ' + createError.message 
      }, { status: 500 })
    }
    
    console.log('Ledger table reset successfully')
    
    return Response.json({ 
      success: true, 
      message: 'Ledger table dropped and recreated successfully' 
    })
    
  } catch (error: unknown) {
    console.error('Error resetting ledger table:', error)
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}
