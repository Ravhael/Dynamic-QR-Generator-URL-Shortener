import { NextRequest, NextResponse } from 'next/server'
import { query as dbQuery } from '@/lib/db'

export async function GET() {
  try {
    console.log('Testing database connection...')
    
    // Test simple query first
    const testResult = await dbQuery('SELECT NOW() as current_time')
    console.log('Database test result:', testResult.rows[0])
    
    return NextResponse.json({
      dbConnection: 'OK',
      currentTime: testResult.rows[0],
      message: 'Database connection working'
    })
    
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({ 
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    console.log('Direct SQL update admin password...')
    
    // Use parameterized query to avoid SQL injection issues
    const bcryptHash = '$2b$10$rOvRoi.yFjr6cZJRBZkQ9O8w7KhF8qiH0z1GmCfMvWCr3KJGCqqKW'
    
    const updateResult = await dbQuery(
      'UPDATE users SET password = $1 WHERE email = $2',
      [bcryptHash, 'admin@scanly.indovisual.co.id']
    )
    
    console.log('Update result:', updateResult.rowCount)
    
    // Check if update worked
    const checkResult = await dbQuery(
      'SELECT id, email, name, role FROM users WHERE email = $1',
      ['admin@scanly.indovisual.co.id']
    )
    
    return NextResponse.json({
      success: true,
      message: '✅ Password updated successfully! Try login with admin123',
      user: checkResult.rows[0],
      rowsUpdated: updateResult.rowCount
    })
    
  } catch (error) {
    console.error('SQL update error:', error)
    return NextResponse.json({ 
      error: 'SQL update failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}