import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import {
    ScanLine,
    X,
    Camera,
    AlertCircle,
    CheckCircle,
    Upload,
    Loader
} from 'lucide-react';

interface QRScannerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function QRScanner({ isOpen, onClose }: QRScannerProps) {
    const navigate = useNavigate();
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && !isScanning) {
            startScanner();
        }

        return () => {
            stopScanner();
        };
    }, [isOpen]);

    const startScanner = async () => {
        setError('');
        setResult('');

        try {
            const scanner = new Html5Qrcode('qr-reader');
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1
                },
                handleScanSuccess,
                () => { } // Ignore scan failures
            );

            setIsScanning(true);
        } catch (err: any) {
            console.error('Scanner error:', err);
            setError(err.message || 'Failed to access camera. Please check permissions.');
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current && isScanning) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (err) {
                console.error('Error stopping scanner:', err);
            }
        }
        setIsScanning(false);
    };

    const handleScanSuccess = (decodedText: string) => {
        // Stop scanner immediately
        stopScanner();
        setIsProcessing(true);

        // Extract address from QR code (handles ethereum: prefix)
        let address = decodedText;
        if (decodedText.startsWith('ethereum:')) {
            address = decodedText.replace('ethereum:', '').split('@')[0].split('?')[0];
        }

        // Validate Ethereum address format
        if (/^0x[a-fA-F0-9]{40}$/.test(address)) {
            setResult(address);
            setTimeout(() => {
                onClose();
                navigate(`/address/${address}`);
            }, 1000);
        } else if (/^0x[a-fA-F0-9]{64}$/.test(address)) {
            // Transaction hash
            setResult(address);
            setTimeout(() => {
                onClose();
                navigate(`/tx/${address}`);
            }, 1000);
        } else if (/^\d+$/.test(address)) {
            // Block number
            setResult(address);
            setTimeout(() => {
                onClose();
                navigate(`/block/${address}`);
            }, 1000);
        } else {
            setError('Invalid QR code. Please scan a valid address, transaction hash, or block number.');
            setIsProcessing(false);
            // Restart scanner after error
            setTimeout(() => startScanner(), 2000);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setError('');
        setIsProcessing(true);

        try {
            const scanner = new Html5Qrcode('qr-file-reader');
            const result = await scanner.scanFile(file, true);
            handleScanSuccess(result);
        } catch {
            setError('Could not read QR code from image. Please try another image.');
            setIsProcessing(false);
        }
    };

    const handleClose = () => {
        stopScanner();
        setResult('');
        setError('');
        setIsProcessing(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="animate-in"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.9)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
            }}
            onClick={handleClose}
        >
            <div
                className="glass-card"
                style={{
                    width: '100%',
                    maxWidth: '420px',
                    borderRadius: '24px',
                    overflow: 'hidden'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: 'var(--gradient-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <ScanLine size={20} color="white" />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                                Scan QR Code
                            </h2>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Scan address, tx hash, or block
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        style={{
                            background: 'var(--bg-glass)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '10px',
                            padding: '8px',
                            cursor: 'pointer',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scanner Area */}
                <div style={{ padding: '24px' }}>
                    {/* Camera Preview */}
                    <div style={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '1',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        background: 'var(--bg-secondary)',
                        marginBottom: '16px'
                    }}>
                        <div id="qr-reader" style={{ width: '100%', height: '100%' }} />

                        {/* Scanning overlay */}
                        {isScanning && !result && (
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '200px',
                                height: '200px',
                                border: '3px solid var(--primary)',
                                borderRadius: '16px',
                                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                                pointerEvents: 'none'
                            }}>
                                {/* Scanning animation */}
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: '3px',
                                    background: 'var(--gradient-primary)',
                                    animation: 'scan 2s infinite linear'
                                }} />
                            </div>
                        )}

                        {/* Processing overlay */}
                        {isProcessing && (
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(0, 0, 0, 0.8)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px'
                            }}>
                                {result ? (
                                    <>
                                        <CheckCircle size={48} style={{ color: 'var(--success)' }} />
                                        <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                                            QR Code Detected!
                                        </span>
                                        <code style={{
                                            fontSize: '0.8rem',
                                            color: 'var(--text-secondary)',
                                            maxWidth: '90%',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {result}
                                        </code>
                                    </>
                                ) : (
                                    <>
                                        <Loader size={32} className="spinner" style={{ color: 'var(--primary)' }} />
                                        <span style={{ color: 'var(--text-secondary)' }}>Processing...</span>
                                    </>
                                )}
                            </div>
                        )}

                        {/* No camera fallback */}
                        {!isScanning && !isProcessing && error && (
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px',
                                padding: '24px',
                                textAlign: 'center'
                            }}>
                                <Camera size={48} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    Camera not available
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Hidden file reader */}
                    <div id="qr-file-reader" style={{ display: 'none' }} />

                    {/* Error message */}
                    {error && (
                        <div style={{
                            padding: '12px 16px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: '12px',
                            marginBottom: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: 'var(--error)',
                            fontSize: '0.85rem'
                        }}>
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Upload button */}
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                    />

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="btn btn-secondary glass"
                        style={{
                            width: '100%',
                            justifyContent: 'center',
                            padding: '14px'
                        }}
                        disabled={isProcessing}
                    >
                        <Upload size={18} />
                        Upload QR Image
                    </button>

                    {/* Instructions */}
                    <div style={{
                        marginTop: '16px',
                        padding: '16px',
                        background: 'var(--bg-glass)',
                        borderRadius: '12px',
                        border: '1px solid var(--glass-border)'
                    }}>
                        <p style={{
                            margin: 0,
                            fontSize: '0.8rem',
                            color: 'var(--text-muted)',
                            textAlign: 'center'
                        }}>
                            💡 <strong>Supported formats:</strong> Ethereum addresses,
                            transaction hashes, and block numbers
                        </p>
                    </div>
                </div>
            </div>

            {/* Keyframe animation */}
            <style>{`
                @keyframes scan {
                    0% { top: 0; }
                    50% { top: calc(100% - 3px); }
                    100% { top: 0; }
                }
            `}</style>
        </div>
    );
}
