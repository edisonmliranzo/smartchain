import { useState, useEffect } from 'react';
import { Bell, BellOff, Check, AlertTriangle } from 'lucide-react';
import { pushService } from '../services/pushNotifications';

export default function NotificationSettings() {
    const [isSupported, setIsSupported] = useState(false);
    const [isEnabled, setIsEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const init = async () => {
            setIsSupported(pushService.isBrowserSupported());
            if (pushService.isPermissionGranted()) {
                const subscription = await pushService.getSubscription();
                setIsEnabled(!!subscription);
            }
        };
        init();
    }, []);

    const handleToggle = async () => {
        setIsLoading(true);
        setError('');

        try {
            if (isEnabled) {
                await pushService.unsubscribe();
                setIsEnabled(false);
            } else {
                await pushService.init();
                const granted = await pushService.requestPermission();

                if (!granted) {
                    setError('Notification permission denied');
                    return;
                }

                const subscription = await pushService.subscribe();
                if (subscription) {
                    setIsEnabled(true);
                    // Show test notification
                    pushService.showLocalNotification('🎉 Notifications Enabled!', {
                        body: 'You will now receive transaction alerts'
                    });
                }
            }
        } catch (err: any) {
            setError(err.message || 'Failed to toggle notifications');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTestNotification = () => {
        pushService.showTransactionNotification(
            '0x1234567890abcdef',
            'confirmed'
        );
    };

    if (!isSupported) {
        return (
            <div className="glass-card" style={{
                padding: '20px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: 'var(--text-muted)'
            }}>
                <BellOff size={20} />
                <span>Push notifications are not supported in this browser</span>
            </div>
        );
    }

    return (
        <div className="glass-card" style={{
            padding: '24px',
            borderRadius: '20px',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: isEnabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {isEnabled ? (
                            <Bell size={22} style={{ color: 'var(--success)' }} />
                        ) : (
                            <BellOff size={22} style={{ color: 'var(--text-muted)' }} />
                        )}
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                            Push Notifications
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            Get alerts for transaction confirmations
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleToggle}
                    disabled={isLoading}
                    className={`btn ${isEnabled ? 'btn-secondary glass' : 'btn-primary'}`}
                    style={{ minWidth: '100px' }}
                >
                    {isLoading ? (
                        <span className="spinner" style={{ width: '16px', height: '16px' }} />
                    ) : isEnabled ? (
                        <>
                            <Check size={16} />
                            Enabled
                        </>
                    ) : (
                        <>
                            <Bell size={16} />
                            Enable
                        </>
                    )}
                </button>
            </div>

            {error && (
                <div style={{
                    padding: '12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '10px',
                    color: 'var(--error)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.9rem',
                    marginBottom: '16px'
                }}>
                    <AlertTriangle size={16} />
                    {error}
                </div>
            )}

            {isEnabled && (
                <div style={{
                    paddingTop: '16px',
                    borderTop: '1px solid var(--glass-border)'
                }}>
                    <button
                        onClick={handleTestNotification}
                        className="btn btn-secondary glass"
                        style={{ fontSize: '0.85rem' }}
                    >
                        🔔 Send Test Notification
                    </button>
                </div>
            )}
        </div>
    );
}
