import {defineStore} from "pinia";
import {type RemovableRef, useStorage} from "@vueuse/core";

interface NotificationsState {
    notifications: Notification[] | RemovableRef<Notification[]>;
}

interface Notification {
    name: string;
    type: string;
    content: string;
}

export const useNotificationState = defineStore({
    id: 'notifications',
    state: (): NotificationsState => ({
        notifications: useStorage('notifications', []),
    }),
    getters: {
        getNotifications(): Notification[] {
            return this.notifications
        }
    },

    actions: {
        addNotification(notification: Notification) {
            this.notifications.push(notification)
        },
        removeNotification(notification: Notification) {
            this.notifications.splice(this.notifications.indexOf(notification), 1)
        },
        clearNotifications() {
            this.notifications = []
        },
        fetchNotifications() {
            this.clearNotifications();
            [
                {
                    name: 'Konnor Guzman',
                    type: 'interview',
                    content: 'hour: 10:00 - 11:30, date: Thu, May 11, 2021',
                },
                {
                    name: 'Laravel Conf',
                    type: 'event',
                    content: 'hour: 06:00 - 16:00, date: Mon, Jul 16, 2021',
                },
                {
                    name: 'Jonh Doe',
                    type: 'interview',
                    content: 'hour: 15:30 - 11:30, date: Wed, Jun 16, 2021',
                },
                {
                    name: 'Konnor Guzman',
                    type: 'alert',
                    content: 'we have a problem on server 1',
                }
            ].forEach((notification) => {
                this.addNotification(notification)
            })
        }
    }

});