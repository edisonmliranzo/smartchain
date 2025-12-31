import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { Copy, Check, Download, QrCode } from 'lucide-react';

interface QRCodeDisplayProps {
    value: string;
    size?: number;
    showActions?: boolean;
}

export default function QRCodeDisplay({ value, size = 180, showActions = true }: QRCodeDisplayProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const svg = document.getElementById('qr-code-svg');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = size * 2;
            canvas.height = size * 2;
            ctx?.fillRect(0, 0, canvas.width, canvas.height);
            ctx!.fillStyle = '#ffffff';
            ctx?.fillRect(0, 0, canvas.width, canvas.height);
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

            const link = document.createElement('a');
            link.download = `smartchain-qr-${value.slice(0, 8)}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    };

    return (
        <div className="glass-card" style={{
            padding: '24px',
            borderRadius: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                fontWeight: 600,
            }}>
                <QrCode size={16} />
                QR Code
            </div>

            <div style={{
                background: 'white',
                padding: '16px',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }}>
                <QRCodeSVG
                    id="qr-code-svg"
                    value={value}
                    size={size}
                    level="H"
                    includeMargin={false}
                    bgColor="#ffffff"
                    fgColor="#1a1a2e"
                />
            </div>

            {showActions && (
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={handleCopy}
                        className="btn btn-secondary glass"
                        style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                    >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                        onClick={handleDownload}
                        className="btn btn-primary"
                        style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                    >
                        <Download size={14} />
                        Save PNG
                    </button>
                </div>
            )}
        </div>
    );
}
