'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import 'shaka-player/dist/controls.css';
import shaka from 'shaka-player/dist/shaka-player.ui';

// Import using dynamic to prevent SSR issues
// const StreamVideoPlayer = dynamic(() => import('components/common/StreamVideoPlayer'), {
//     ssr: false,
// });

const StreamVideoPlayer = ({ manifestUrl, className }) => {
    const manifestUri = useMemo(() => manifestUrl, [manifestUrl]);
    const [playerReady, setPlayerReady] = useState(false);
    const videoRef = useRef(null);
    const playerRef = useRef(null);

    useEffect(() => {
        if (!shaka.Player.isBrowserSupported()) {
            console.error('Browser not supported!');
            return;
        }

        shaka.polyfill.installAll();

        const initPlayer = async () => {
            // Create player without arguments
            const player = new shaka.Player();
            
            // Then attach to video element
            await player.attach(videoRef.current);
            
            playerRef.current = player;
            setPlayerReady(true);

            player.addEventListener('error', (event) => {
                const error = event.detail;
                console.error('Error code ' + error.code + ' object', error);
            });
        };

        initPlayer();

        // Cleanup function
        return () => {
            if (playerRef.current) {
                playerRef.current.destroy();
            }
        };
    }, []);

    useEffect(() => {
        if (!playerRef.current) {
            return;
        }
        const player = playerRef.current;

        const load = async () => {
            try {
                if (!manifestUri) {
                    await player.unload();
                    return;
                }
                console.log('Loading manifest:', manifestUri);
                await player.load(manifestUri);
            } catch (error) {
                console.error('Error code ' + error.code + ' object', error);
            }
        };

        load();
    }, [manifestUri, playerReady]);

    return (
        <video
            ref={videoRef}
            className={className}
            controls
            playsInline
            crossOrigin='anonymous'
        />
    );
};

export default StreamVideoPlayer;