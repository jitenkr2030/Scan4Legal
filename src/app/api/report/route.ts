import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { caseId, recipient, type } = await request.json()

    // Get case details
    const caseRecord = await db.case.findUnique({
      where: { id: caseId },
      include: {
        client: true,
        lawyer: true,
        callSessions: {
          where: { status: 'ended' },
          orderBy: { startTime: 'desc' },
          take: 1
        }
      }
    })

    if (!caseRecord) {
      return NextResponse.json(
        { success: false, error: 'Case not found' },
        { status: 404 }
      )
    }

    const lastSession = caseRecord.callSessions[0]
    
    // Generate report content
    const reportContent = generateReportContent(caseRecord, lastSession)

    // Save report to database
    const report = await db.report.create({
      data: {
        caseId,
        clientId: caseRecord.clientId,
        type,
        recipient,
        content: reportContent,
        status: 'sent'
      }
    })

    // In a real implementation, you would integrate with:
    // - WhatsApp Business API
    // - SMS gateway (Twilio, etc.)
    // - Email service (SendGrid, etc.)
    
    // For demo purposes, we'll just log it
    console.log(`Report sent via ${type} to ${recipient}:`, reportContent)

    return NextResponse.json({
      success: true,
      reportId: report.id,
      message: `Report sent successfully via ${type}`
    })
  } catch (error) {
    console.error('Error sending report:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send report' },
      { status: 500 }
    )
  }
}

function generateReportContent(caseRecord: any, lastSession: any) {
  const duration = lastSession ? Math.floor((lastSession.endTime?.getTime() || Date.now()) - lastSession.startTime.getTime()) / 1000 : 0
  const minutes = Math.floor(duration / 60)
  const seconds = duration % 60

  return `
LEGAL CONSULTATION REPORT
========================

Case ID: ${caseRecord.id}
Date: ${new Date().toLocaleDateString()}
Category: ${caseRecord.category}
Urgency: ${caseRecord.urgency}

Client Information:
- ID: ${caseRecord.client.id}
- Phone: ${caseRecord.client.phone || 'Not provided'}
- Email: ${caseRecord.client.email || 'Not provided'}

Consultation Details:
- Lawyer: ${caseRecord.lawyer?.name || 'Not assigned'}
- Duration: ${minutes}m ${seconds}s
- Type: ${lastSession?.type || 'N/A'}
- Date: ${lastSession?.startTime.toLocaleDateString() || 'N/A'}

Legal Advice Provided:
${caseRecord.advice || 'Advice details will be updated by the lawyer.'}

Summary:
${caseRecord.summary || 'Case summary will be generated.'}

Next Steps:
1. Follow the legal advice provided during consultation
2. Keep all relevant documents and evidence safe
3. Contact your lawyer if you need further assistance
4. Save this report for future reference

Important Notes:
- This consultation is confidential
- The advice provided is based on the information shared
- For complex matters, consider filing a formal case
- Keep this report safe for future reference

For any queries, contact: support@scan4legal.com
Helpline: 1800-LEGAL-HELP
  `.trim()
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const caseId = searchParams.get('caseId')

    if (!caseId) {
      return NextResponse.json(
        { success: false, error: 'Case ID is required' },
        { status: 400 }
      )
    }

    const reports = await db.report.findMany({
      where: { caseId },
      orderBy: { sentAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      reports
    })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}