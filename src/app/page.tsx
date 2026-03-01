'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Phone, Video, MessageCircle, MapPin, Clock, AlertTriangle, Mic, Users, Shield, Gavel } from 'lucide-react'
import { useLanguage } from '@/hooks/use-language'

export default function Scan4Legal() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isEmergency, setIsEmergency] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const { t, language, setLanguage } = useLanguage()

  const legalCategories = [
    { id: 'police', icon: '🚓', label: t('police_issue'), color: 'bg-blue-500' },
    { id: 'domestic', icon: '👩', label: t('domestic_violence'), color: 'bg-pink-500' },
    { id: 'property', icon: '🏠', label: t('property_dispute'), color: 'bg-green-500' },
    { id: 'loan', icon: '💰', label: t('loan_money'), color: 'bg-yellow-500' },
    { id: 'labour', icon: '👷', label: t('labour_issue'), color: 'bg-orange-500' },
    { id: 'accident', icon: '🚑', label: t('accident'), color: 'bg-red-500' }
  ]

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' }
  ]

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.log('Location access denied:', error)
        }
      )
    }
  }, [])

  const handleConnect = (callType: 'video' | 'audio' | 'chat') => {
    if (!selectedCategory && !isEmergency) {
      alert(t('select_category_first'))
      return
    }

    setIsConnecting(true)
    
    // Simulate connection to lawyer
    setTimeout(() => {
      window.location.href = `/call?type=${callType}&category=${selectedCategory || 'emergency'}&emergency=${isEmergency}`
    }, 2000)
  }

  const handleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      const recognition = new SpeechRecognition()
      
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US'
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        alert(`You said: ${transcript}`)
        // Here you would process the speech and categorize the issue
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        alert(t('voice_error'))
      }

      recognition.start()
    } else {
      alert(t('voice_not_supported'))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Gavel className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Scan4Legal</h1>
                <p className="text-xs text-gray-500">{t('instant_legal_help')}</p>
              </div>
            </div>
            
            {/* Language Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{t('language')}:</span>
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nativeName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Emergency Button */}
        <div className="mb-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                  <div>
                    <h3 className="text-lg font-bold text-red-900">{t('emergency_help')}</h3>
                    <p className="text-sm text-red-700">{t('emergency_description')}</p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setIsEmergency(true)
                    handleConnect('video')
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  size="lg"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  {t('get_help_now')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Voice Input for Illiterate Users */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5" />
              {t('voice_help')}
            </CardTitle>
            <CardDescription>{t('voice_description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleVoiceInput}
              variant="outline" 
              className="w-full"
              size="lg"
            >
              <Mic className="w-4 h-4 mr-2" />
              {t('press_and_speak')}
            </Button>
          </CardContent>
        </Card>

        {/* Legal Categories */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            {t('select_your_issue')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {legalCategories.map((category) => (
              <Card
                key={category.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedCategory === category.id 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:scale-105'
                }`}
                onClick={() => {
                  setSelectedCategory(category.id)
                  setIsEmergency(false)
                }}
              >
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 ${category.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                    <span className="text-2xl">{category.icon}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{category.label}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Connection Options */}
        {(selectedCategory || isEmergency) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {t('connect_with_lawyer')}
              </CardTitle>
              <CardDescription>
                {isEmergency ? t('emergency_connecting') : t('choose_call_type')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => handleConnect('video')}
                  disabled={isConnecting}
                  className="h-20 flex flex-col gap-2"
                  size="lg"
                >
                  <Video className="w-6 h-6" />
                  {t('video_call')}
                </Button>
                <Button
                  onClick={() => handleConnect('audio')}
                  disabled={isConnecting}
                  variant="outline"
                  className="h-20 flex flex-col gap-2"
                  size="lg"
                >
                  <Phone className="w-6 h-6" />
                  {t('audio_call')}
                </Button>
                <Button
                  onClick={() => handleConnect('chat')}
                  disabled={isConnecting}
                  variant="outline"
                  className="h-20 flex flex-col gap-2"
                  size="lg"
                >
                  <MessageCircle className="w-6 h-6" />
                  {t('chat')}
                </Button>
              </div>
              
              {isConnecting && (
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-gray-600">{t('connecting')}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Location Info */}
        {userLocation && (
          <div className="mt-6 text-center">
            <Badge variant="outline" className="text-xs">
              <MapPin className="w-3 h-3 mr-1" />
              {t('location_detected')}
            </Badge>
          </div>
        )}

        {/* Trust Indicators */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <Shield className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <h4 className="font-semibold text-sm">{t('confidential')}</h4>
            <p className="text-xs text-gray-600">{t('privacy_protected')}</p>
          </div>
          <div className="text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <h4 className="font-semibold text-sm">{t('24_7_available')}</h4>
            <p className="text-xs text-gray-600">{t('always_here')}</p>
          </div>
          <div className="text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <h4 className="font-semibold text-sm">{t('expert_lawyers')}</h4>
            <p className="text-xs text-gray-600">{t('qualified_help')}</p>
          </div>
          <div className="text-center">
            <Gavel className="w-8 h-8 mx-auto mb-2 text-orange-600" />
            <h4 className="font-semibold text-sm">{t('free_consultation')}</h4>
            <p className="text-xs text-gray-600">{t('no_hidden_charges')}</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-600">
            <p>{t('footer_text')}</p>
            <p className="mt-2">{t('helpline')}: 1800-LEGAL-HELP</p>
          </div>
        </div>
      </footer>
    </div>
  )
}