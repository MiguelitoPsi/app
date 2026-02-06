'use client'

import { useCallback, useEffect, useState } from 'react'
import { trpc } from '@/lib/trpc/client'

type PushPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported'

// Regex to detect mobile devices
const MOBILE_REGEX = /mobile|android|iphone|ipad|ipod/i

export function usePushNotifications() {
  const [permissionState, setPermissionState] = useState<PushPermissionState>('prompt')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true) // Start as loading until we check
  const [error, setError] = useState<string | null>(null)
  const [browserSubscription, setBrowserSubscription] = useState<PushSubscription | null>(null)
  const [browserChecked, setBrowserChecked] = useState(false)

  const { data: vapidData } = trpc.push.getVapidPublicKey.useQuery(undefined, {
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  })
  const {
    data: pushStatus,
    refetch: refetchStatus,
    isLoading: isStatusLoading,
  } = trpc.push.getStatus.useQuery()
  const subscribeMutation = trpc.push.subscribe.useMutation()
  const unsubscribeMutation = trpc.push.unsubscribe.useMutation()

  // Check if push notifications are supported
  const isSupported =
    typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window

  // Check current permission state and browser subscription
  useEffect(() => {
    if (!isSupported) {
      setPermissionState('unsupported')
      setIsLoading(false)
      setBrowserChecked(true)
      return
    }

    const checkPermissionAndSubscription = async () => {
      // Check permission
      const permission = Notification.permission
      setPermissionState(permission as PushPermissionState)

      // Check browser subscription
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        setBrowserSubscription(subscription)
      } catch (err) {
        console.error('Error checking browser subscription:', err)
      }
      setBrowserChecked(true)
    }

    checkPermissionAndSubscription()
  }, [isSupported])

  // Determine if subscribed based on both backend status AND browser subscription
  useEffect(() => {
    // Wait for both checks to complete
    if (isStatusLoading || !browserChecked) return

    // User is subscribed if:
    // 1. Backend says they're enabled AND has subscriptions, OR
    // 2. Browser has an active subscription (which means we should sync with backend)
    const backendSubscribed = pushStatus?.enabled && (pushStatus?.subscriptionCount ?? 0) > 0
    const browserHasSubscription = browserSubscription !== null

    // If browser has subscription but backend doesn't know, we're still subscribed
    // The user might have subscribed on this device
    setIsSubscribed(backendSubscribed || browserHasSubscription)
    setIsLoading(false)
  }, [pushStatus, browserSubscription, isStatusLoading, browserChecked])

  // Convert VAPID key to Uint8Array
  const urlBase64ToUint8Array = useCallback((base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }, [])

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!(isSupported && vapidData?.vapidPublicKey)) {
      setError('Push notifications não suportadas')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      // Request permission
      const permission = await Notification.requestPermission()
      setPermissionState(permission as PushPermissionState)

      if (permission !== 'granted') {
        setError('Permissão negada para notificações')
        setIsLoading(false)
        return false
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready

      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription()

      // If no subscription, create one
      if (!subscription) {
        const applicationServerKey = urlBase64ToUint8Array(vapidData.vapidPublicKey)
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        })
      }

      // Get subscription keys
      const subscriptionJson = subscription.toJSON()
      const keys = subscriptionJson.keys as { p256dh: string; auth: string }

      // Detect device type
      const userAgent = navigator.userAgent.toLowerCase()
      const isMobile = MOBILE_REGEX.test(userAgent)
      const deviceType = isMobile ? 'mobile' : 'desktop'

      // Save to backend
      await subscribeMutation.mutateAsync({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
        deviceType,
        userAgent: navigator.userAgent,
      })

      setBrowserSubscription(subscription)
      setIsSubscribed(true)
      await refetchStatus()
      setIsLoading(false)
      return true
    } catch (err) {
      console.error('Error subscribing to push:', err)
      setError('Erro ao ativar notificações')
      setIsLoading(false)
      return false
    }
  }, [isSupported, vapidData, urlBase64ToUint8Array, subscribeMutation, refetchStatus])

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      // Get service worker registration
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      // Unsubscribe from browser
      if (subscription) {
        await subscription.unsubscribe()
      }

      // Remove from backend
      await unsubscribeMutation.mutateAsync({
        endpoint: subscription?.endpoint,
      })

      setBrowserSubscription(null)
      setIsSubscribed(false)
      await refetchStatus()
      setIsLoading(false)
      return true
    } catch (err) {
      console.error('Error unsubscribing from push:', err)
      setError('Erro ao desativar notificações')
      setIsLoading(false)
      return false
    }
  }, [isSupported, unsubscribeMutation, refetchStatus])

  // Toggle subscription
  const toggle = useCallback((): Promise<boolean> => {
    if (isSubscribed) {
      return unsubscribe()
    }
    return subscribe()
  }, [isSubscribed, subscribe, unsubscribe])

  return {
    isSupported,
    permissionState,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    toggle,
    pushStatus,
  }
}
