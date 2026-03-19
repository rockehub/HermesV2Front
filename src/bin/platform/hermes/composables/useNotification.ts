// composables/useNotification.ts
import { ref, type Ref } from 'vue'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: number
  message: unknown
  type: NotificationType
  duration: number
}

const notifications: Ref<Notification[]> = ref([])
let notificationId = 0

export function useNotification() {
  const show = (message: unknown, type: NotificationType = 'success', duration = 3000): number => {
    const id = notificationId++

    notifications.value.push({
      id,
      message,
      type,
      duration
    })

    if (duration > 0) {
      setTimeout(() => {
        remove(id)
      }, duration)
    }

    return id
  }

  const remove = (id: number): void => {
    const index = notifications.value.findIndex((n) => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  const success = (message: unknown, duration?: number) => show(message, 'success', duration)

  const error = (message: unknown, duration?: number) => show(message, 'error', duration)

  const warning = (message: unknown, duration?: number) => show(message, 'warning', duration)

  const info = (message: unknown, duration?: number) => show(message, 'info', duration)

  return {
    notifications,
    show,
    remove,
    success,
    error,
    warning,
    info
  }
}
