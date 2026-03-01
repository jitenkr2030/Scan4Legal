import { Server } from 'socket.io'
import { createServer } from 'http'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

// Store active connections
const activeClients = new Map<string, any>()
const activeLawyers = new Map<string, any>()
const waitingClients = new Array<any>()

// Helper function to find available lawyer
function findAvailableLawyer(category: string, isEmergency: boolean) {
  const lawyers = Array.from(activeLawyers.values())
  
  // For emergency, prioritize online and available lawyers
  if (isEmergency) {
    return lawyers.find(lawyer => 
      lawyer.isOnline && 
      lawyer.isAvailable &&
      (!lawyer.specializations || lawyer.specializations.includes(category))
    )
  }
  
  // For normal calls, find any available lawyer
  return lawyers.find(lawyer => 
    lawyer.isOnline && 
    lawyer.isAvailable
  )
}

// Helper function to match client with lawyer
function matchClientWithLawyer(clientSocket: any) {
  const client = activeClients.get(clientSocket.id)
  if (!client) return

  const lawyer = findAvailableLawyer(client.category, client.isEmergency)
  
  if (lawyer) {
    // Update lawyer status
    lawyer.isAvailable = false
    lawyer.currentCallId = client.caseId
    
    // Create call session in database
    prisma.callSession.create({
      data: {
        caseId: client.caseId,
        clientId: client.clientId,
        lawyerId: lawyer.lawyerId,
        type: client.callType,
        status: 'connected'
      }
    }).then(session => {
      // Connect client and lawyer
      clientSocket.emit('lawyer-connected', {
        lawyerId: lawyer.lawyerId,
        lawyerName: lawyer.name,
        sessionId: session.id
      })
      
      const lawyerSocket = io.sockets.sockets.get(lawyer.socketId)
      if (lawyerSocket) {
        lawyerSocket.emit('client-connected', {
          clientId: client.clientId,
          category: client.category,
          isEmergency: client.isEmergency,
          sessionId: session.id,
          callType: client.callType
        })
      }
      
      // Remove from waiting queue
      const index = waitingClients.findIndex(c => c.socketId === clientSocket.id)
      if (index > -1) {
        waitingClients.splice(index, 1)
      }
    })
  } else {
    // Add to waiting queue
    if (!waitingClients.find(c => c.socketId === clientSocket.id)) {
      waitingClients.push(client)
    }
    
    clientSocket.emit('waiting-for-lawyer', {
      queuePosition: waitingClients.length,
      estimatedWaitTime: waitingClients.length * 2 // 2 minutes per person
    })
  }
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`)

  // Client joins
  socket.on('client-join', async (data) => {
    const { clientId, category, callType, isEmergency, location } = data
    
    // Create case
    const caseRecord = await prisma.case.create({
      data: {
        clientId,
        category,
        urgency: isEmergency ? 'emergency' : 'normal',
        locationLat: location?.lat,
        locationLng: location?.lng,
        locationAddress: location?.address
      }
    })

    const clientData = {
      socketId: socket.id,
      clientId,
      caseId: caseRecord.id,
      category,
      callType,
      isEmergency,
      joinedAt: new Date()
    }

    activeClients.set(socket.id, clientData)
    
    // Try to match with lawyer immediately
    matchClientWithLawyer(socket)
  })

  // Lawyer joins
  socket.on('lawyer-join', async (data) => {
    const { lawyerId, languages, specializations } = data
    
    // Get lawyer details from database
    const lawyer = await prisma.lawyer.findUnique({
      where: { id: lawyerId }
    })

    if (lawyer) {
      const lawyerData = {
        socketId: socket.id,
        lawyerId,
        name: lawyer.name,
        languages: languages || JSON.parse(lawyer.languages || '[]'),
        specializations: specializations || JSON.parse(lawyer.specializations || '[]'),
        isOnline: true,
        isAvailable: true,
        joinedAt: new Date()
      }

      activeLawyers.set(socket.id, lawyerData)
      
      // Update lawyer status in database
      await prisma.lawyer.update({
        where: { id: lawyerId },
        data: { isOnline: true }
      })

      socket.emit('lawyer-registered', { success: true })
      
      // Check if there are waiting clients
      if (waitingClients.length > 0) {
        const nextClient = waitingClients.shift()
        if (nextClient) {
          const clientSocket = io.sockets.sockets.get(nextClient.socketId)
          if (clientSocket) {
            matchClientWithLawyer(clientSocket)
          }
        }
      }
    }
  })

  // Handle WebRTC signaling
  socket.on('offer', (data) => {
    const { targetSocketId, offer } = data
    const targetSocket = io.sockets.sockets.get(targetSocketId)
    if (targetSocket) {
      targetSocket.emit('offer', { fromSocketId: socket.id, offer })
    }
  })

  socket.on('answer', (data) => {
    const { targetSocketId, answer } = data
    const targetSocket = io.sockets.sockets.get(targetSocketId)
    if (targetSocket) {
      targetSocket.emit('answer', { fromSocketId: socket.id, answer })
    }
  })

  socket.on('ice-candidate', (data) => {
    const { targetSocketId, candidate } = data
    const targetSocket = io.sockets.sockets.get(targetSocketId)
    if (targetSocket) {
      targetSocket.emit('ice-candidate', { fromSocketId: socket.id, candidate })
    }
  })

  // Handle chat messages
  socket.on('chat-message', (data) => {
    const { targetSocketId, message, sessionId } = data
    const targetSocket = io.sockets.sockets.get(targetSocketId)
    if (targetSocket) {
      targetSocket.emit('chat-message', { 
        fromSocketId: socket.id, 
        message,
        timestamp: new Date()
      })
    }

    // Save message to database
    // This would be implemented with a messages table
  })

  // End call
  socket.on('end-call', async (data) => {
    const { sessionId, rating, feedback } = data
    
    // Update call session
    await prisma.callSession.update({
      where: { id: sessionId },
      data: {
        status: 'ended',
        endTime: new Date(),
        quality: rating
      }
    })

    // Update lawyer availability
    const lawyerData = Array.from(activeLawyers.values()).find(l => l.currentCallId === sessionId)
    if (lawyerData) {
      lawyerData.isAvailable = true
      lawyerData.currentCallId = null
      
      await prisma.lawyer.update({
        where: { id: lawyerData.lawyerId },
        data: { isAvailable: true }
      })

      // Check for waiting clients
      if (waitingClients.length > 0) {
        const nextClient = waitingClients.shift()
        if (nextClient) {
          const clientSocket = io.sockets.sockets.get(nextClient.socketId)
          if (clientSocket) {
            setTimeout(() => matchClientWithLawyer(clientSocket), 1000)
          }
        }
      }
    }

    // Notify other party
    const client = activeClients.get(socket.id)
    if (client) {
      // Find the lawyer and notify them
      const lawyer = Array.from(activeLawyers.values()).find(l => l.currentCallId === sessionId)
      if (lawyer) {
        const lawyerSocket = io.sockets.sockets.get(lawyer.socketId)
        if (lawyerSocket) {
          lawyerSocket.emit('call-ended', { sessionId, rating, feedback })
        }
      }
    } else {
      // This is a lawyer, notify the client
      const lawyer = activeLawyers.get(socket.id)
      if (lawyer) {
        const client = Array.from(activeClients.values()).find(c => c.caseId === sessionId)
        if (client) {
          const clientSocket = io.sockets.sockets.get(client.socketId)
          if (clientSocket) {
            clientSocket.emit('call-ended', { sessionId })
          }
        }
      }
    }
  })

  // Handle disconnection
  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${socket.id}`)

    // Handle client disconnect
    const client = activeClients.get(socket.id)
    if (client) {
      // Remove from waiting queue
      const index = waitingClients.findIndex(c => c.socketId === socket.id)
      if (index > -1) {
        waitingClients.splice(index, 1)
      }

      // End any active calls
      if (client.caseId) {
        await prisma.callSession.updateMany({
          where: { 
            caseId: client.caseId,
            status: 'connected'
          },
          data: {
            status: 'ended',
            endTime: new Date()
          }
        })
      }

      activeClients.delete(socket.id)
    }

    // Handle lawyer disconnect
    const lawyer = activeLawyers.get(socket.id)
    if (lawyer) {
      // Update lawyer status in database
      await prisma.lawyer.update({
        where: { id: lawyer.lawyerId },
        data: { 
          isOnline: false,
          isAvailable: false,
          currentCallId: null
        }
      })

      activeLawyers.delete(socket.id)
    }
  })
})

// Start server
const PORT = 3003
httpServer.listen(PORT, () => {
  console.log(`Scan4Legal WebSocket service running on port ${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down WebSocket service...')
  await prisma.$disconnect()
  process.exit(0)
})