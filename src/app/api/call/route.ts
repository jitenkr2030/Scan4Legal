import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { clientId, category, callType, isEmergency, location } = await request.json()

    // Create a new case
    const caseRecord = await db.case.create({
      data: {
        clientId,
        category,
        urgency: isEmergency ? 'emergency' : 'normal',
        locationLat: location?.lat,
        locationLng: location?.lng,
        locationAddress: location?.address
      }
    })

    // Create initial call session
    const callSession = await db.callSession.create({
      data: {
        caseId: caseRecord.id,
        clientId,
        type: callType,
        status: 'initiated'
      }
    })

    return NextResponse.json({
      success: true,
      caseId: caseRecord.id,
      sessionId: callSession.id
    })
  } catch (error) {
    console.error('Error creating call session:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create call session' },
      { status: 500 }
    )
  }
}