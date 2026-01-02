import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { api } from '../api';
import { MessageSquare, Send, User, Clock, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const CHAT_ADDRESS = '0x0000000000000000000000000000000000001337'; // The "Chat Room" address

export default function ChainChat() {
    const { account, connectWallet } = useWeb3();
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<any[]>([]);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Poll for messages
    useEffect(() => {
        loadMessages();
        const interval = setInterval(loadMessages, 2000);
        return () => clearInterval(interval);
    }, []);

    const loadMessages = async () => {
        try {
            // Get transactions sent to the Chat Address
            const result = await api.getAccountTransactions(CHAT_ADDRESS, 1, 50);

            const decodedMessages = result.transactions.map((tx: any) => {
                try {
                    // Input data is hex. Convert to utf8.
                    const hex = tx.input.substring(2);
                    const bytes = new Uint8Array(hex.match(/.{1,2}/g)?.map((byte: string) => parseInt(byte, 16)) || []);
                    const str = new TextDecoder().decode(bytes);

                    // Filter out non-printable or clean up
                    return {
                        id: tx.hash,
                        sender: tx.from,
                        text: str,
                        timestamp: tx.timestamp,
                        block: tx.blockNumber
                    };
                } catch (e) {
                    return null;
                }
            }).filter((m: any) => m && m.text).reverse(); // Oldest first for chat flow

            // Only update if different (to avoid jitter, though React handles diffing)
            setMessages(decodedMessages);
        } catch (e) {
            console.error("Failed to load chat", e);
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !account) return;

        setIsSending(true);
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            // Encode message to hex using TextEncoder
            const bytes = new TextEncoder().encode(message);
            const hexData = '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');

            // Send 0 value tx with data
            const tx = await signer.sendTransaction({
                to: CHAT_ADDRESS,
                value: 0,
                data: hexData
            });

            setMessage('');

            // Optimistically add message
            setMessages(prev => [...prev, {
                id: 'pending-' + Date.now(),
                sender: account,
                text: message,
                timestamp: Date.now() / 1000,
                isPending: true
            }]);

            await tx.wait();
            loadMessages(); // Refresh immediately after confirm

        } catch (err: any) {
            console.error(err);
            alert("Failed to send message: " + (err.message || err));
        } finally {
            setIsSending(false);
        }
    };

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="container animate-in" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
            <div className="glass-card" style={{
                maxWidth: '800px',
                margin: '0 auto',
                height: '80vh',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '30px',
                overflow: 'hidden',
                position: 'relative'
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px',
                    borderBottom: '1px solid var(--glass-border)',
                    background: 'rgba(0,0,0,0.2)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ background: 'var(--accent)', padding: '10px', borderRadius: '12px', color: 'black' }}>
                            <MessageSquare size={24} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>ChainChat Global</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--success)' }}>
                                <span className="pulse-active" style={{ width: '6px', height: '6px' }}></span>
                                <span>LIVE ON-CHAIN</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <div>Room Contract</div>
                        <div style={{ fontFamily: 'monospace' }}>{CHAT_ADDRESS.slice(0, 8)}...{CHAT_ADDRESS.slice(-4)}</div>
                    </div>
                </div>

                {/* Messages Area */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    {messages.length === 0 ? (
                        <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-muted)' }}>
                            <MessageSquare size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                            <p>No messages yet. Be the first to say hello!</p>
                            <p style={{ fontSize: '0.8rem' }}>Messages are stored permanently on the SmartChain.</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = account && msg.sender.toLowerCase() === account.toLowerCase();
                            return (
                                <div key={msg.id} style={{
                                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                                    maxWidth: '80%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: isMe ? 'flex-end' : 'flex-start'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        marginBottom: '4px',
                                        fontSize: '0.75rem',
                                        color: 'var(--text-muted)'
                                    }}>
                                        <User size={12} />
                                        <Link to={`/address/${msg.sender}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                            {isMe ? 'You' : `${msg.sender.slice(0, 6)}...${msg.sender.slice(-4)}`}
                                        </Link>
                                        <span>•</span>
                                        <Clock size={12} />
                                        {msg.isPending ? 'Sending...' : new Date(msg.timestamp * 1000).toLocaleTimeString()}
                                    </div>

                                    <div style={{
                                        padding: '12px 16px',
                                        borderRadius: '16px',
                                        borderTopRightRadius: isMe ? '4px' : '16px',
                                        borderTopLeftRadius: isMe ? '16px' : '4px',
                                        background: isMe ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                        color: isMe ? 'white' : 'var(--text-primary)',
                                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                        border: isMe ? 'none' : '1px solid var(--glass-border)',
                                        wordBreak: 'break-word'
                                    }}>
                                        {msg.text}
                                    </div>
                                    {msg.isPending && <div style={{ fontSize: '0.7rem', color: 'var(--accent)', marginTop: '2px' }}>Confirming...</div>}
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div style={{
                    padding: '24px',
                    borderTop: '1px solid var(--glass-border)',
                    background: 'rgba(0,0,0,0.2)'
                }}>
                    {!account ? (
                        <button onClick={connectWallet} className="btn btn-primary" style={{ width: '100%' }}>
                            Connect Wallet to Chat
                        </button>
                    ) : (
                        <form onSubmit={sendMessage} style={{ display: 'flex', gap: '12px' }}>
                            <input
                                type="text"
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                placeholder="Type a message (stored on-chain forever)..."
                                className="input glass"
                                style={{ flex: 1, borderRadius: '12px' }}
                                disabled={isSending}
                            />
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isSending || !message.trim()}
                                style={{ borderRadius: '12px', width: '50px', padding: 0, justifyContent: 'center' }}
                            >
                                {isSending ? <Loader2 className="spinner" size={20} /> : <Send size={20} />}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
