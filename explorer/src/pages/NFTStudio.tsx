import { useState } from 'react';
import { Image, Upload, Sparkles, Layers, Tag, DollarSign, CheckCircle, Loader } from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';

export default function NFTStudio() {
    const { account } = useWeb3();
    const [step, setStep] = useState(1);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        collection: '',
        royalty: '5',
        price: '',
        attributes: [{ trait: '', value: '' }]
    });
    const [minting, setMinting] = useState(false);
    const [minted, setMinted] = useState(false);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
                setStep(2);
            };
            reader.readAsDataURL(file);
        }
    };

    const addAttribute = () => {
        setFormData(prev => ({
            ...prev,
            attributes: [...prev.attributes, { trait: '', value: '' }]
        }));
    };

    const updateAttribute = (index: number, field: 'trait' | 'value', value: string) => {
        const newAttrs = [...formData.attributes];
        newAttrs[index][field] = value;
        setFormData(prev => ({ ...prev, attributes: newAttrs }));
    };

    const handleMint = async () => {
        if (!account) {
            alert('Please connect your wallet');
            return;
        }
        setMinting(true);
        // Simulate minting
        await new Promise(resolve => setTimeout(resolve, 3000));
        setMinting(false);
        setMinted(true);
    };

    return (
        <div className="container animate-in" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '8px 20px', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '30px', marginBottom: '16px' }}>
                    <Sparkles size={18} color="#ec4899" />
                    <span style={{ color: '#ec4899', fontWeight: 600, letterSpacing: '2px', fontSize: '0.8rem' }}>NFT STUDIO</span>
                </div>
                <h1 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px' }}>
                    Create Your NFT
                </h1>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
                    Mint unique digital assets on SmartChain with zero gas fees
                </p>
            </div>

            {/* Progress Steps */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '48px' }}>
                {['Upload', 'Details', 'Mint'].map((label, i) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: step > i ? 'var(--success)' : step === i + 1 ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            color: step > i || step === i + 1 ? 'white' : 'var(--text-muted)'
                        }}>
                            {step > i ? <CheckCircle size={18} /> : i + 1}
                        </div>
                        <span style={{ color: step >= i + 1 ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
                        {i < 2 && <div style={{ width: '40px', height: '2px', background: step > i + 1 ? 'var(--success)' : 'var(--glass-border)' }} />}
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: imagePreview ? '1fr 1fr' : '1fr', gap: '32px', maxWidth: '1000px', margin: '0 auto' }}>
                {/* Left: Upload / Preview */}
                <div className="glass-card" style={{ padding: '32px', borderRadius: '24px' }}>
                    {!imagePreview ? (
                        <label style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '400px',
                            border: '2px dashed var(--glass-border)',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}>
                            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: 'rgba(236, 72, 153, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '20px'
                            }}>
                                <Upload size={32} color="#ec4899" />
                            </div>
                            <h3 style={{ marginBottom: '8px' }}>Upload Artwork</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>PNG, JPG, GIF, SVG, WEBP (Max 50MB)</p>
                        </label>
                    ) : (
                        <div style={{ textAlign: 'center' }}>
                            <img
                                src={imagePreview}
                                alt="NFT Preview"
                                style={{
                                    width: '100%',
                                    maxHeight: '400px',
                                    objectFit: 'contain',
                                    borderRadius: '16px',
                                    marginBottom: '16px'
                                }}
                            />
                            <button
                                onClick={() => { setImagePreview(null); setStep(1); }}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--glass-border)',
                                    background: 'transparent',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer'
                                }}
                            >
                                Change Image
                            </button>
                        </div>
                    )}
                </div>

                {/* Right: Form (visible after upload) */}
                {imagePreview && (
                    <div className="glass-card" style={{ padding: '32px', borderRadius: '24px' }}>
                        {!minted ? (
                            <>
                                <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <Image size={24} color="#ec4899" /> NFT Details
                                </h3>

                                <InputField
                                    label="Name"
                                    icon={<Tag size={16} />}
                                    value={formData.name}
                                    onChange={(v) => setFormData(prev => ({ ...prev, name: v }))}
                                    placeholder="My Awesome NFT"
                                />

                                <InputField
                                    label="Description"
                                    icon={<Layers size={16} />}
                                    value={formData.description}
                                    onChange={(v) => setFormData(prev => ({ ...prev, description: v }))}
                                    placeholder="Describe your NFT..."
                                    multiline
                                />

                                <InputField
                                    label="Collection"
                                    icon={<Sparkles size={16} />}
                                    value={formData.collection}
                                    onChange={(v) => setFormData(prev => ({ ...prev, collection: v }))}
                                    placeholder="Collection Name (optional)"
                                />

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <InputField
                                        label="Royalty %"
                                        icon={<DollarSign size={16} />}
                                        value={formData.royalty}
                                        onChange={(v) => setFormData(prev => ({ ...prev, royalty: v }))}
                                        placeholder="5"
                                        type="number"
                                    />
                                    <InputField
                                        label="Price (SMC)"
                                        icon={<DollarSign size={16} />}
                                        value={formData.price}
                                        onChange={(v) => setFormData(prev => ({ ...prev, price: v }))}
                                        placeholder="0 = Not for sale"
                                        type="number"
                                    />
                                </div>

                                {/* Attributes */}
                                <div style={{ marginTop: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Attributes</label>
                                        <button onClick={addAttribute} style={{
                                            padding: '6px 12px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: 'rgba(236, 72, 153, 0.1)',
                                            color: '#ec4899',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem'
                                        }}>
                                            + Add
                                        </button>
                                    </div>
                                    {formData.attributes.map((attr, i) => (
                                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                                            <input
                                                value={attr.trait}
                                                onChange={(e) => updateAttribute(i, 'trait', e.target.value)}
                                                placeholder="Trait"
                                                style={{
                                                    padding: '12px',
                                                    borderRadius: '10px',
                                                    border: '1px solid var(--glass-border)',
                                                    background: 'rgba(255,255,255,0.03)',
                                                    color: 'var(--text-primary)',
                                                    fontSize: '0.9rem'
                                                }}
                                            />
                                            <input
                                                value={attr.value}
                                                onChange={(e) => updateAttribute(i, 'value', e.target.value)}
                                                placeholder="Value"
                                                style={{
                                                    padding: '12px',
                                                    borderRadius: '10px',
                                                    border: '1px solid var(--glass-border)',
                                                    background: 'rgba(255,255,255,0.03)',
                                                    color: 'var(--text-primary)',
                                                    fontSize: '0.9rem'
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={handleMint}
                                    disabled={minting || !formData.name}
                                    className="btn btn-primary"
                                    style={{
                                        width: '100%',
                                        marginTop: '24px',
                                        padding: '16px',
                                        borderRadius: '14px',
                                        fontSize: '1rem',
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    {minting ? (
                                        <>
                                            <Loader size={20} className="spin-slow" /> Minting...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={20} /> Mint NFT
                                        </>
                                    )}
                                </button>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 24px'
                                }}>
                                    <CheckCircle size={40} color="var(--success)" />
                                </div>
                                <h2 style={{ marginBottom: '8px' }}>NFT Minted! 🎉</h2>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                                    Your NFT "{formData.name}" has been created successfully
                                </p>
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                    <button className="btn btn-primary" style={{ padding: '12px 24px' }}>
                                        View on Explorer
                                    </button>
                                    <button
                                        onClick={() => { setMinted(false); setImagePreview(null); setStep(1); setFormData({ name: '', description: '', collection: '', royalty: '5', price: '', attributes: [{ trait: '', value: '' }] }); }}
                                        className="btn btn-secondary glass"
                                        style={{ padding: '12px 24px' }}
                                    >
                                        Create Another
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Recent Mints */}
            <div style={{ marginTop: '64px' }}>
                <h2 style={{ marginBottom: '24px', textAlign: 'center' }}>🔥 Recently Minted</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px' }}>
                    {[
                        { name: 'Cosmic Ape #42', price: '50 SMC', img: '🦧' },
                        { name: 'Pixel Dragon', price: '120 SMC', img: '🐉' },
                        { name: 'Neon Cat #7', price: '25 SMC', img: '🐱' },
                        { name: 'Abstract Mind', price: '200 SMC', img: '🧠' },
                    ].map((nft, i) => (
                        <div key={i} className="glass-card hover-card" style={{ padding: '16px', borderRadius: '20px' }}>
                            <div style={{
                                height: '180px',
                                background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(236,72,153,0.2))',
                                borderRadius: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '4rem',
                                marginBottom: '12px'
                            }}>
                                {nft.img}
                            </div>
                            <h4 style={{ marginBottom: '4px' }}>{nft.name}</h4>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Price</span>
                                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{nft.price}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function InputField({ label, icon, value, onChange, placeholder, type = 'text', multiline = false }: {
    label: string;
    icon: React.ReactNode;
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    type?: string;
    multiline?: boolean;
}) {
    const baseStyle = {
        width: '100%',
        padding: '14px 14px 14px 44px',
        borderRadius: '12px',
        border: '1px solid var(--glass-border)',
        background: 'rgba(255,255,255,0.03)',
        color: 'var(--text-primary)',
        fontSize: '0.95rem',
        outline: 'none'
    };

    return (
        <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>{label}</label>
            <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: multiline ? '14px' : '50%', transform: multiline ? 'none' : 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    {icon}
                </div>
                {multiline ? (
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        rows={3}
                        style={{ ...baseStyle, resize: 'none' }}
                    />
                ) : (
                    <input
                        type={type}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        style={baseStyle}
                    />
                )}
            </div>
        </div>
    );
}
