"use client";

import { useCallback, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc/client";

type PushPermissionState = "prompt" | "granted" | "denied" | "unsupported";

// Regex to detect mobile devices
const MOBILE_REGEX = /mobile|android|iphone|ipad|ipod/i;

export function usePushNotifications() {
  const [permissionState, setPermissionState] =
    useState<PushPermissionState>("prompt");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: vapidData } = trpc.push.getVapidPublicKey.useQuery(undefined, {
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  });
  const { data: pushStatus, refetch: refetchStatus } =
    trpc.push.getStatus.useQuery();
  const subscribeMutation = trpc.push.subscribe.useMutation();
  const unsubscribeMutation = trpc.push.unsubscribe.useMutation();
  const updateLastActiveMutation = trpc.push.updateLastActive.useMutation();

  // Check if push notifications are supported
  const isSupported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window;

  // Check current permission state
  useEffect(() => {
    if (!isSupported) {
      setPermissionState("unsupported");
      return;
    }

    const checkPermission = () => {
      const permission = Notification.permission;
      setPermissionState(permission as PushPermissionState);
    };

    checkPermission();
  }, [isSupported]);

  // Check if already subscribed
  useEffect(() => {
    if (pushStatus) {
      setIsSubscribed(pushStatus.enabled && pushStatus.subscriptionCount > 0);
    }
  }, [pushStatus]);

  // Update last active on mount
  useEffect(() => {
    if (isSupported) {
      updateLastActiveMutation.mutate();
    }
  }, [isSupported, updateLastActiveMutation]);

  // Convert VAPID key to Uint8Array
  const urlBase64ToUint8Array = useCallback(
    (base64String: string): Uint8Array => {
      const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    },
    []
  );

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!(isSupported && vapidData?.vapidPublicKey)) {
      setError("Push notifications não suportadas");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      setPermissionState(permission as PushPermissionState);

      if (permission !== "granted") {
        setError("Permissão negada para notificações");
        setIsLoading(false);
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription();

      // If no subscription, create one
      if (!subscription) {
        const applicationServerKey = urlBase64ToUint8Array(
          vapidData.vapidPublicKey
        );
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
      }

      // Get subscription keys
      const subscriptionJson = subscription.toJSON();
      const keys = subscriptionJson.keys as { p256dh: string; auth: string };

      // Detect device type
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = MOBILE_REGEX.test(userAgent);
      const deviceType = isMobile ? "mobile" : "desktop";

      // Save to backend
      await subscribeMutation.mutateAsync({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
        deviceType,
        userAgent: navigator.userAgent,
      });

      setIsSubscribed(true);
      await refetchStatus();
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error("Error subscribing to push:", err);
      setError("Erro ao ativar notificações");
      setIsLoading(false);
      return false;
    }
  }, [
    isSupported,
    vapidData,
    urlBase64ToUint8Array,
    subscribeMutation,
    refetchStatus,
  ]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      // Unsubscribe from browser
      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remove from backend
      await unsubscribeMutation.mutateAsync({
        endpoint: subscription?.endpoint,
      });

      setIsSubscribed(false);
      await refetchStatus();
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error("Error unsubscribing from push:", err);
      setError("Erro ao desativar notificações");
      setIsLoading(false);
      return false;
    }
  }, [isSupported, unsubscribeMutation, refetchStatus]);

  // Toggle subscription
  const toggle = useCallback((): Promise<boolean> => {
    if (isSubscribed) {
      return unsubscribe();
    }
    return subscribe();
  }, [isSubscribed, subscribe, unsubscribe]);

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
  };
}
