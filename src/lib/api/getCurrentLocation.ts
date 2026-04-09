'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function GetLatLng() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check for secure origin
    const isSecureOrigin = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (!isSecureOrigin) {
      console.warn('Geolocation requires a secure origin.');
      return;
    }

    if (!navigator.geolocation) {
      console.log('Geolocation not supported')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude

        console.log('Latitude:', lat)
        console.log('Longitude:', lng)

        // ✅ Server ko bhejna (URL params ke through)
        router.replace(`/?lat=${lat}&lng=${lng}`)
      },
      (error) => {
        console.log('Error:', error.message)
      }
    )
  }, [router])

  return null
}