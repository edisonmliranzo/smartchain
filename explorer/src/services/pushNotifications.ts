// Push Notification Service for SmartChain Explorer

const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

interface PushSubscription {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

class PushNotificationService {
    private subscription: PushSubscription | null = null;
    private isSupported: boolean = false;
    private permission: NotificationPermission = 'default';

    constructor() {
        this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    }

    async init(): Promise<boolean> {
        if (!this.isSupported) {
            console.log('Push notifications not supported');
            return false;
        }

        try {
            // Register service worker
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered:', registration);
            return true;
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            return false;
        }
    }

    async requestPermission(): Promise<boolean> {
        if (!this.isSupported) return false;

        try {
            this.permission = await Notification.requestPermission();
            return this.permission === 'granted';
        } catch (error) {
            console.error('Permission request failed:', error);
            return false;
        }
    }

    async subscribe(): Promise<PushSubscription | null> {
        if (!this.isSupported || this.permission !== 'granted') return null;

        try {
            const registration = await navigator.serviceWorker.ready;

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource
            });

            this.subscription = subscription.toJSON() as PushSubscription;

            // Store subscription in localStorage for persistence
            localStorage.setItem('push-subscription', JSON.stringify(this.subscription));

            return this.subscription;
        } catch (error) {
            console.error('Subscription failed:', error);
            return null;
        }
    }

    async unsubscribe(): Promise<boolean> {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();
                localStorage.removeItem('push-subscription');
                this.subscription = null;
                return true;
            }
            return false;
        } catch (error) {
            console.error('Unsubscribe failed:', error);
            return false;
        }
    }

    async getSubscription(): Promise<PushSubscription | null> {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            return subscription?.toJSON() as PushSubscription || null;
        } catch {
            return null;
        }
    }

    isPermissionGranted(): boolean {
        return Notification.permission === 'granted';
    }

    isBrowserSupported(): boolean {
        return this.isSupported;
    }

    // Show a local notification (for testing or immediate feedback)
    showLocalNotification(title: string, options?: NotificationOptions): void {
        if (this.permission !== 'granted') return;

        new Notification(title, {
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            ...options
        });
    }

    // Show notification for transaction confirmation
    showTransactionNotification(hash: string, status: 'pending' | 'confirmed' | 'failed'): void {
        const messages = {
            pending: {
                title: '⏳ Transaction Pending',
                body: `Transaction ${hash.slice(0, 10)}... is being processed`
            },
            confirmed: {
                title: '✅ Transaction Confirmed',
                body: `Transaction ${hash.slice(0, 10)}... was successful!`
            },
            failed: {
                title: '❌ Transaction Failed',
                body: `Transaction ${hash.slice(0, 10)}... has failed`
            }
        };

        const { title, body } = messages[status];
        this.showLocalNotification(title, {
            body,
            tag: hash,
            requireInteraction: status === 'failed'
        });
    }

    private urlBase64ToUint8Array(base64String: string): Uint8Array {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
}

export const pushService = new PushNotificationService();
export default pushService;
