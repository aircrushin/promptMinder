import { NextResponse } from 'next/server'
import { getSession } from '@/lib/local-auth/session.js'

export async function GET() {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({
        isSignedIn: false,
        user: null
      })
    }
    
    return NextResponse.json({
      isSignedIn: true,
      user: session.user
    })
    
  } catch (error) {
    console.error('获取会话错误:', error)
    return NextResponse.json({
      isSignedIn: false,
      user: null
    })
  }
}
