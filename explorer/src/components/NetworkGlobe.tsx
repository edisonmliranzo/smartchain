import { useEffect, useRef, useState } from 'react';
import Globe from 'react-globe.gl';

const NODES = [
    { id: 'Atlas Node', lat: 40.7128, lng: -74.0060, city: 'New York, US', status: 'active' },
    { id: 'Zeus Prime', lat: 51.5074, lng: -0.1278, city: 'London, UK', status: 'active' },
    { id: 'Hermes Oracle', lat: 1.3521, lng: 103.8198, city: 'Singapore', status: 'active' },
    { id: 'Apollo Forge', lat: 35.6762, lng: 139.6503, city: 'Tokyo, JP', status: 'active' },
    { id: 'Athena Core', lat: 52.5200, lng: 13.4050, city: 'Berlin, DE', status: 'active' }
];

export default function NetworkGlobe() {
    const globeEl = useRef<any>();
    const [points, setPoints] = useState<any[]>([]);
    const [arcs, setArcs] = useState<any[]>([]);
    const [rings, setRings] = useState<any[]>([]);

    useEffect(() => {
        // Initialize static data
        setPoints(NODES.map(n => ({
            ...n,
            size: 1.5,
            color: n.status === 'active' ? '#00ff41' : 'red'
        })));

        // Generate arcs (Mesh topology)
        const newArcs: any[] = [];
        for (let i = 0; i < NODES.length; i++) {
            for (let j = i + 1; j < NODES.length; j++) {
                newArcs.push({
                    startLat: NODES[i].lat,
                    startLng: NODES[i].lng,
                    endLat: NODES[j].lat,
                    endLng: NODES[j].lng,
                    color: [['#00ff41', 'rgba(0,255,65,0.2)']],
                });
            }
        }
        setArcs(newArcs);

        // Configure Globe
        if (globeEl.current) {
            // Center view on Atlantic to show US and Europe (Atlas & Zeus)
            globeEl.current.pointOfView({ lat: 40, lng: -35, altitude: 2.0 }, 1000);

            globeEl.current.controls().autoRotate = true;
            globeEl.current.controls().autoRotateSpeed = 0.5;
        }
    }, []);

    // Simulate ping rings
    useEffect(() => {
        const interval = setInterval(() => {
            const randomNode = NODES[Math.floor(Math.random() * NODES.length)];
            setRings(prev => [
                ...prev.slice(-4),
                { lat: randomNode.lat, lng: randomNode.lng, maxR: 8, propagationSpeed: 4, repeatPeriod: 800 }
            ]);
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ width: '100%', height: '100%', background: '#000000', borderRadius: '20px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Globe
                ref={globeEl}
                backgroundColor="rgba(0,0,0,0)"
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"

                pointsData={points}
                pointAltitude={0.15}
                pointColor="color"
                pointRadius="size"
                pointLabel="id"

                arcsData={arcs}
                arcColor="color"
                arcDashLength={0.4}
                arcDashGap={0.2}
                arcDashAnimateTime={2000}
                arcStroke={0.5}

                ringsData={rings}
                ringColor={() => '#00ff41'}
                ringMaxRadius="maxR"
                ringPropagationSpeed="propagationSpeed"
                ringRepeatPeriod="repeatPeriod"

                width={800} // Explicit width/height to ensure proper rendering if container is tricky
                height={600}
            />
        </div>
    );
}
