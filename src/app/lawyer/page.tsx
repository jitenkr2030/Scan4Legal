'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Phone, Video, MessageSquare, Clock, MapPin, Star, TrendingUp, Users, DollarSign, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { io, Socket } from 'socket.io-client'

interface Lawyer {
  id: string
  name: string
  email: string
  phone: string
  languages: string[]
  specializations: string[]
  experience: number
  rating: number
  totalCases: number
  isOnline: boolean
  isAvailable: boolean
  earnings: number
}

interface CallRequest {
  clientId: string
  category: string
  isEmergency: boolean
  callType: string
  location?: {
    lat: number
    lng: number
    address: string
  }
  timestamp: Date
}

interface CallSession {
  id: string
  clientInfo: {
    id: string
    name?: string
    phone?: string
  }
  category: string
  type: string
  status: string
  startTime: Date
  endTime?: Date
  duration?: number
  cost: number
  paymentStatus: string
}

export default function LawyerDashboard() {
  const [lawyer, setLawyer] = useState<Lawyer | null>(null)
  const [isOnline, setIsOnline] = useState(false)
  const [incomingCall, setIncomingCall] = useState<CallRequest | null>(null)
  const [currentCall, setCurrentCall] = useState<CallSession | null>(null)
  const [callHistory, setCallHistory] = useState<CallSession[]>([])
  const [socket, setSocket] = useState<Socket | null>(null)

  // Function declarations
  const loadCallHistory = () => {
    // Mock call history data
    const mockHistory: CallSession[] = [
      {
        id: 'session-1',
        clientInfo: { id: 'client-1', name: 'Amit Singh', phone: '+91-9876543211' },
        category: 'property',
        type: 'video',
        status: 'completed',
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
        duration: 1800,
        cost: 150,
        paymentStatus: 'paid'
      },
      {
        id: 'session-2',
        clientInfo: { id: 'client-2', name: 'Priya Sharma', phone: '+91-9876543212' },
        category: 'domestic',
        type: 'audio',
        status: 'completed',
        startTime: new Date(Date.now() - 5 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 4.5 * 60 * 60 * 1000),
        duration: 1200,
        cost: 100,
        paymentStatus: 'paid'
      },
      {
        id: 'session-3',
        clientInfo: { id: 'client-3', phone: '+91-9876543213' },
        category: 'accident',
        type: 'video',
        status: 'completed',
        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 23.5 * 60 * 60 * 1000),
        duration: 2400,
        cost: 200,
        paymentStatus: 'pending'
      }
    ]
    setCallHistory(mockHistory)
  }

  useEffect(() => {
    // Mock lawyer data - in real app, this would come from authentication
    const mockLawyer: Lawyer = {
      id: 'lawyer-1',
      name: 'Adv. Rajesh Kumar',
      email: 'rajesh.kumar@scan4legal.com',
      phone: '+91-9876543210',
      languages: ['English', 'Hindi', 'Punjabi'],
      specializations: ['criminal', 'family', 'property'],
      experience: 8,
      rating: 4.7,
      totalCases: 342,
      isOnline: false,
      isAvailable: true,
      earnings: 45670
    }
    setLawyer(mockLawyer)

    // Initialize WebSocket connection
    const socketInstance = io('/?XTransformPort=3003')
    setSocket(socketInstance)

    socketInstance.on('connect', () => {
      console.log('Connected to WebSocket server')
    })

    socketInstance.on('client-connected', (data) => {
      setIncomingCall(data)
    })

    socketInstance.on('call-ended', () => {
      setCurrentCall(null)
      // Refresh call history
      loadCallHistory()
    })

    // Load mock call history
    loadCallHistory()

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  const toggleOnlineStatus = () => {
    const newStatus = !isOnline
    setIsOnline(newStatus)
    
    if (socket && lawyer) {
      if (newStatus) {
        socket.emit('lawyer-join', {
          lawyerId: lawyer.id,
          languages: lawyer.languages,
          specializations: lawyer.specializations
        })
      } else {
        socket.disconnect()
        // Reconnect if needed
        setTimeout(() => {
          const newSocket = io('/?XTransformPort=3003')
          setSocket(newSocket)
        }, 1000)
      }
    }
  }

  const acceptCall = () => {
    if (incomingCall && socket && lawyer) {
      setCurrentCall({
        id: 'session-' + Date.now(),
        clientInfo: { id: incomingCall.clientId },
        category: incomingCall.category,
        type: incomingCall.callType,
        status: 'active',
        startTime: new Date(),
        cost: incomingCall.isEmergency ? 200 : 150,
        paymentStatus: 'pending'
      })
      
      setIncomingCall(null)
      
      // Navigate to call interface or open call modal
      window.location.href = `/lawyer/call?sessionId=${currentCall?.id}&clientId=${incomingCall.clientId}`
    }
  }

  const rejectCall = () => {
    setIncomingCall(null)
    // Notify client that lawyer is unavailable
  }

  const endCurrentCall = () => {
    if (currentCall && socket) {
      socket.emit('end-call', {
        sessionId: currentCall.id,
        rating: 5, // Would be collected from UI
        feedback: 'Good session'
      })
    }
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      police: '🚓',
      domestic: '👩',
      property: '🏠',
      loan: '💰',
      labour: '👷',
      accident: '🚑'
    }
    return icons[category] || '⚖️'
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  if (!lawyer) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">S4L</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Lawyer Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome back, {lawyer.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-sm font-medium">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              
              <Button
                onClick={toggleOnlineStatus}
                variant={isOnline ? "destructive" : "default"}
              >
                {isOnline ? 'Go Offline' : 'Go Online'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Cases</p>
                  <p className="text-2xl font-bold text-gray-900">{lawyer.totalCases}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rating</p>
                  <p className="text-2xl font-bold text-gray-900">{lawyer.rating}</p>
                </div>
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Earnings</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(lawyer.earnings)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Experience</p>
                  <p className="text-2xl font-bold text-gray-900">{lawyer.experience} yrs</p>
                </div>
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Incoming Call Alert */}
        {incomingCall && (
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Phone className="w-6 h-6 text-orange-600 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Incoming Call Request</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <Badge variant={incomingCall.isEmergency ? "destructive" : "outline"}>
                        {getCategoryIcon(incomingCall.category)} {incomingCall.category}
                      </Badge>
                      <Badge variant="outline">
                        {incomingCall.callType}
                      </Badge>
                      {incomingCall.isEmergency && (
                        <Badge variant="destructive" className="animate-pulse">
                          Emergency
                        </Badge>
                      )}
                    </div>
                    {incomingCall.location && (
                      <p className="text-sm text-gray-600 mt-2 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {incomingCall.location.address}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={rejectCall} variant="outline">
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button onClick={acceptCall}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Call */}
        {currentCall && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="animate-pulse">
                      {currentCall.type === 'video' ? <Video className="w-6 h-6 text-green-600" /> :
                       currentCall.type === 'audio' ? <Phone className="w-6 h-6 text-green-600" /> :
                       <MessageSquare className="w-6 h-6 text-green-600" />}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Current Call Active</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <Badge variant="outline">
                        {getCategoryIcon(currentCall.category)} {currentCall.category}
                      </Badge>
                      <Badge variant="outline">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDuration(Math.floor((Date.now() - currentCall.startTime.getTime()) / 1000))}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <Button onClick={endCurrentCall} variant="destructive">
                  End Call
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="history">Call History</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your latest legal consultations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {callHistory.slice(0, 3).map((call) => (
                      <div key={call.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            {call.type === 'video' ? <Video className="w-5 h-5 text-blue-600" /> :
                             call.type === 'audio' ? <Phone className="w-5 h-5 text-blue-600" /> :
                             <MessageSquare className="w-5 h-5 text-blue-600" />}
                          </div>
                          <div>
                            <p className="font-medium">{call.clientInfo.name || 'Anonymous Client'}</p>
                            <p className="text-sm text-gray-500">{getCategoryIcon(call.category)} {call.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(call.cost)}</p>
                          <p className="text-sm text-gray-500">{formatDuration(call.duration || 0)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance</CardTitle>
                  <CardDescription>Your key metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Average Call Duration</span>
                      <span className="text-sm">18 minutes</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Success Rate</span>
                      <span className="text-sm">96%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Client Satisfaction</span>
                      <span className="text-sm">4.8/5.0</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Monthly Earnings</span>
                      <span className="text-sm font-bold">{formatCurrency(12500)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Call History</CardTitle>
                <CardDescription>Your complete consultation history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Client</th>
                        <th className="text-left p-2">Category</th>
                        <th className="text-left p-2">Type</th>
                        <th className="text-left p-2">Duration</th>
                        <th className="text-left p-2">Cost</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {callHistory.map((call) => (
                        <tr key={call.id} className="border-b">
                          <td className="p-2">
                            <div>
                              <p className="font-medium">{call.clientInfo.name || 'Anonymous'}</p>
                              <p className="text-sm text-gray-500">{call.clientInfo.phone}</p>
                            </div>
                          </td>
                          <td className="p-2">
                            <Badge variant="outline">
                              {getCategoryIcon(call.category)} {call.category}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-1">
                              {call.type === 'video' ? <Video className="w-4 h-4" /> :
                               call.type === 'audio' ? <Phone className="w-4 h-4" /> :
                               <MessageSquare className="w-4 h-4" />}
                              <span className="capitalize">{call.type}</span>
                            </div>
                          </td>
                          <td className="p-2">{formatDuration(call.duration || 0)}</td>
                          <td className="p-2 font-medium">{formatCurrency(call.cost)}</td>
                          <td className="p-2">
                            <Badge variant={call.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                              {call.paymentStatus}
                            </Badge>
                          </td>
                          <td className="p-2 text-sm text-gray-500">
                            {call.startTime.toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Full Name</label>
                    <p className="font-medium">{lawyer.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="font-medium">{lawyer.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="font-medium">{lawyer.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Experience</label>
                    <p className="font-medium">{lawyer.experience} years</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Professional Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Languages</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {lawyer.languages.map((lang) => (
                        <Badge key={lang} variant="outline">{lang}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Specializations</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {lawyer.specializations.map((spec) => (
                        <Badge key={spec} variant="outline">{spec}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Rating</label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= Math.floor(lawyer.rating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-medium">{lawyer.rating}/5.0</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="earnings">
            <Card>
              <CardHeader>
                <CardTitle>Earnings Overview</CardTitle>
                <CardDescription>Your financial performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                    <p className="text-3xl font-bold text-green-600">{formatCurrency(lawyer.earnings)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">This Month</p>
                    <p className="text-3xl font-bold text-blue-600">{formatCurrency(12500)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Average per Call</p>
                    <p className="text-3xl font-bold text-purple-600">{formatCurrency(133)}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold">Recent Transactions</h3>
                  {callHistory.map((call) => (
                    <div key={call.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{call.clientInfo.name || 'Anonymous Client'}</p>
                        <p className="text-sm text-gray-500">{call.startTime.toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(call.cost)}</p>
                        <Badge variant={call.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                          {call.paymentStatus}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}