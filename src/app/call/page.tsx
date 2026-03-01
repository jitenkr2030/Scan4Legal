'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Phone, Video, VideoOff, Mic, MicOff, MessageSquare, Send, Clock, MapPin, User, Star } from 'lucide-react'
import { io, Socket } from 'socket.io-client'
import { useLanguage } from '@/hooks/use-language'

interface CallState {
  status: 'connecting' | 'waiting' | 'connected' | 'ended' | 'failed'
  sessionId?: string
  lawyerName?: string
  lawyerId?: string
  queuePosition?: number
  estimatedWaitTime?: number
  startTime?: Date
}

export default function CallPage() {
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  
  const callType = searchParams.get('type') as 'video' | 'audio' | 'chat'
  const category = searchParams.get('category')
  const isEmergency = searchParams.get('emergency') === 'true'
  
  const [callState, setCallState] = useState<CallState>({ status: 'connecting' })
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video')
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [chatMessages, setChatMessages] = useState<Array<{message: string, sender: 'me' | 'lawyer', timestamp: Date}>>([])
  const [callDuration, setCallDuration] = useState(0)
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [showRating, setShowRating] = useState(false)
  
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const socketRef = useRef<Socket | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Function declarations
  const initializeWebRTC = async () => {
    try {
      // Get local media
      const constraints = {
        video: callType === 'video',
        audio: true
      }
      
      const localStream = await navigator.mediaDevices.getUserMedia(constraints)
      localStreamRef.current = localStream
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream
      }
      
      // Create peer connection
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      }
      
      const peerConnection = new RTCPeerConnection(configuration)
      peerConnectionRef.current = peerConnection
      
      // Add local stream
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream)
      })
      
      // Handle remote stream
      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0]
        }
      }
      
      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('ice-candidate', {
            targetSocketId: 'lawyer', // This would be dynamic
            candidate: event.candidate
          })
        }
      }
      
      // Create and send offer
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)
      
      socketRef.current?.emit('offer', {
        targetSocketId: 'lawyer', // This would be dynamic
        offer
      })
      
    } catch (error) {
      console.error('Error accessing media devices:', error)
      setCallState({ status: 'failed' })
    }
  }

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoEnabled(videoTrack.enabled)
      }
    }
  }

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsAudioEnabled(audioTrack.enabled)
      }
    }
  }

  const sendMessage = () => {
    if (chatMessage.trim() && socketRef.current) {
      socketRef.current.emit('chat-message', {
        targetSocketId: 'lawyer', // This would be dynamic
        message: chatMessage,
        sessionId: callState.sessionId
      })
      
      setChatMessages(prev => [...prev, {
        message: chatMessage,
        sender: 'me',
        timestamp: new Date()
      }])
      
      setChatMessage('')
    }
  }

  const generateReports = async () => {
    try {
      // Send reports via different channels
      const reportTypes = [
        { type: 'email', recipient: 'client@example.com' }, // Would get from user profile
        { type: 'whatsapp', recipient: '+919876543210' },   // Would get from user profile
        { type: 'sms', recipient: '+919876543210' }         // Would get from user profile
      ]

      for (const report of reportTypes) {
        await fetch('/api/report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            caseId: callState.sessionId,
            recipient: report.recipient,
            type: report.type
          })
        })
      }
    } catch (error) {
      console.error('Error generating reports:', error)
    }
  }

  const endCall = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    
    if (socketRef.current && callState.sessionId) {
      socketRef.current.emit('end-call', {
        sessionId: callState.sessionId,
        rating,
        feedback
      })
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
    }
    
    // Generate and send reports
    await generateReports()
    
    setCallState({ status: 'ended' })
    setShowRating(true)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getCategoryIcon = (cat: string) => {
    const icons: Record<string, string> = {
      police: '🚓',
      domestic: '👩',
      property: '🏠',
      loan: '💰',
      labour: '👷',
      accident: '🚑'
    }
    return icons[cat] || '⚖️'
  }

  useEffect(() => {
    // Initialize WebSocket connection
    socketRef.current = io('/?XTransformPort=3003')
    
    socketRef.current.on('connect', () => {
      console.log('Connected to WebSocket server')
      
      // Join as client
      const clientId = 'client-' + Math.random().toString(36).substr(2, 9)
      socketRef.current?.emit('client-join', {
        clientId,
        category,
        callType,
        isEmergency,
        location: {
          lat: 28.6139, // Default to Delhi
          lng: 77.2090,
          address: 'Delhi, India'
        }
      })
    })

    socketRef.current.on('waiting-for-lawyer', (data) => {
      setCallState({
        status: 'waiting',
        queuePosition: data.queuePosition,
        estimatedWaitTime: data.estimatedWaitTime
      })
    })

    socketRef.current.on('lawyer-connected', (data) => {
      setCallState({
        status: 'connected',
        sessionId: data.sessionId,
        lawyerName: data.lawyerName,
        lawyerId: data.lawyerId,
        startTime: new Date()
      })
      
      // Start call timer
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
      
      // Initialize WebRTC for video/audio calls
      if (callType !== 'chat') {
        initializeWebRTC()
      }
    })

    socketRef.current.on('offer', async (data) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer))
        const answer = await peerConnectionRef.current.createAnswer()
        await peerConnectionRef.current.setLocalDescription(answer)
        socketRef.current?.emit('answer', {
          targetSocketId: data.fromSocketId,
          answer
        })
      }
    })

    socketRef.current.on('answer', async (data) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer))
      }
    })

    socketRef.current.on('ice-candidate', async (data) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate))
      }
    })

    socketRef.current.on('chat-message', (data) => {
      setChatMessages(prev => [...prev, {
        message: data.message,
        sender: 'lawyer',
        timestamp: new Date(data.timestamp)
      }])
    })

    socketRef.current.on('call-ended', () => {
      endCall()
    })

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      socketRef.current?.disconnect()
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [callType, category, isEmergency])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">S4L</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Scan4Legal</h1>
                <p className="text-xs text-gray-500">
                  {callType === 'video' ? t('video_call') : callType === 'audio' ? t('audio_call') : t('chat')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {isEmergency && (
                <Badge variant="destructive" className="animate-pulse">
                  {t('emergency_help')}
                </Badge>
              )}
              
              <Badge variant="outline">
                {getCategoryIcon(category || '')} {category}
              </Badge>
              
              {callState.status === 'connected' && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  {formatDuration(callDuration)}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Connecting/Waiting State */}
        {(callState.status === 'connecting' || callState.status === 'waiting') && (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {callState.status === 'connecting' ? t('connecting') : t('waiting_for_lawyer')}
              </h2>
              
              {callState.status === 'waiting' && (
                <div className="space-y-2">
                  <p className="text-gray-600">
                    {t('queue_position')}: {callState.queuePosition}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t('estimated_wait')}: {callState.estimatedWaitTime} {t('minutes')}
                  </p>
                </div>
              )}
              
              <div className="mt-6">
                <Button onClick={endCall} variant="outline">
                  {t('cancel')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Connected State */}
        {callState.status === 'connected' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video/Audio Area */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Remote Video/Lawyer Info */}
                    <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ minHeight: '300px' }}>
                      {callType === 'video' ? (
                        <video
                          ref={remoteVideoRef}
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full min-h-[300px]">
                          <div className="text-center text-white">
                            <User className="w-16 h-16 mx-auto mb-2" />
                            <h3 className="text-xl font-semibold">{callState.lawyerName}</h3>
                            <p className="text-gray-300">{t('lawyer')}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Local Video */}
                    {callType === 'video' && (
                      <div className="relative">
                        <video
                          ref={localVideoRef}
                          autoPlay
                          muted
                          playsInline
                          className="w-32 h-24 rounded-lg border-2 border-white shadow-lg absolute bottom-4 right-4 object-cover"
                        />
                      </div>
                    )}

                    {/* Call Controls */}
                    <div className="flex items-center justify-center gap-4 pt-4">
                      {callType !== 'chat' && (
                        <>
                          <Button
                            onClick={toggleAudio}
                            variant={isAudioEnabled ? "default" : "destructive"}
                            size="lg"
                            className="rounded-full"
                          >
                            {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                          </Button>
                          
                          {callType === 'video' && (
                            <Button
                              onClick={toggleVideo}
                              variant={isVideoEnabled ? "default" : "destructive"}
                              size="lg"
                              className="rounded-full"
                            >
                              {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                            </Button>
                          )}
                        </>
                      )}
                      
                      <Button
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        variant="outline"
                        size="lg"
                        className="rounded-full"
                      >
                        <MessageSquare className="w-5 h-5" />
                      </Button>
                      
                      <Button
                        onClick={endCall}
                        variant="destructive"
                        size="lg"
                        className="rounded-full"
                      >
                        <Phone className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-1">
              <Card className={`h-full ${!isChatOpen && 'hidden lg:block'}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    {t('chat')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col h-full">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-96">
                    {chatMessages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            msg.sender === 'me'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {msg.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="flex gap-2">
                    <Textarea
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder={t('type_message')}
                      className="flex-1"
                      rows={2}
                    />
                    <Button onClick={sendMessage} size="sm">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Call Ended */}
        {callState.status === 'ended' && (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-10 h-10 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t('call_ended')}
              </h2>
              
              <p className="text-gray-600 mb-6">
                {t('call_duration')}: {formatDuration(callDuration)}
              </p>

              {showRating && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">{t('rate_experience')}</p>
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          className="text-2xl"
                        >
                          <Star
                            className={`w-8 h-8 ${
                              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder={t('share_feedback')}
                      className="max-w-md mx-auto"
                    />
                  </div>
                </div>
              )}
              
              <div className="mt-6 space-x-4">
                <Button onClick={() => window.location.href = '/'}>
                  {t('back_to_home')}
                </Button>
                {showRating && (
                  <Button onClick={endCall} variant="outline">
                    {t('submit_feedback')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Failed State */}
        {callState.status === 'failed' && (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-10 h-10 text-red-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t('connection_failed')}
              </h2>
              
              <p className="text-gray-600 mb-6">
                {t('try_again_later')}
              </p>
              
              <div className="space-x-4">
                <Button onClick={() => window.location.reload()}>
                  {t('try_again')}
                </Button>
                <Button onClick={() => window.location.href = '/'} variant="outline">
                  {t('back_to_home')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}