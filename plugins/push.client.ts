// Registers the native app for FCM so calls ring and alerts arrive while Viorp is closed.
import { defineNuxtPlugin, useRouter, useRuntimeConfig } from '#app'
import { watch } from 'vue'
import { useSupabaseUser } from '#imports'
import { Capacitor } from '@capacitor/core'

export default defineNuxtPlugin(async () => {
  if (!Capacitor.isNativePlatform()) return
  const minBuild = Number(useRuntimeConfig().public.fcmMinBuild) || 0
  if (!minBuild) return
  const { App } = await import('@capacitor/app')
  const info = await App.getInfo().catch(() => null)
  // Builds without google-services.json crash inside register(), so only newer builds opt in.
  if (!info || Number(info.build) < minBuild) return

  const { PushNotifications } = await import('@capacitor/push-notifications')
  const user = useSupabaseUser()
  const router = useRouter()
  let token: string | null = null

  const save = async () => {
    if (!token || !user.value) return
    await $fetch('/api/push/register', { method: 'POST', body: { token }, retry: 2 }).catch(() => undefined)
  }

  await PushNotifications.createChannel({ id: 'calls', name: 'Calls', description: 'Incoming voice and video calls', importance: 5, visibility: 1, sound: 'default', vibration: true }).catch(() => undefined)
  await PushNotifications.createChannel({ id: 'default', name: 'Notifications', importance: 4, visibility: 1 }).catch(() => undefined)

  await PushNotifications.addListener('registration', ({ value }) => { token = value; void save() })
  await PushNotifications.addListener('pushNotificationActionPerformed', ({ notification }) => {
    const chatId = (notification.data as Record<string, string> | undefined)?.chatId
    // Opening the app reconnects the socket, which replays the ringing call.
    if (chatId) void router.push(`/chat?room=${encodeURIComponent(chatId)}`)
  })

  watch(() => user.value?.id, async (id) => {
    if (!id) return
    try {
      let perm = await PushNotifications.checkPermissions()
      if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') perm = await PushNotifications.requestPermissions()
      if (perm.receive === 'granted') await PushNotifications.register()
    } catch { /* push unavailable on this device */ }
  }, { immediate: true })
})
