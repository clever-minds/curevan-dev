
'use client';

const AnimatedWave = () => {
    return (
        <div className="absolute top-0 left-0 w-full h-full z-0">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 1920 945"
                preserveAspectRatio="xMidYMid slice"
                width="100%"
                height="100%"
            >
                <defs>
                    <linearGradient id="waveGradient" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0" stopColor="hsl(var(--primary))" />
                        <stop offset="1" stopColor="hsl(var(--accent))" />
                    </linearGradient>
                </defs>
                <g>
                    <path
                        className="wave-1"
                        opacity="0.4"
                        fill="url(#waveGradient)"
                        d="M 0 0 L 0 648.24 Q 192 676.75 384 641.82 T 768 685.47 T 1152 642.11 T 1536 683.69 T 1920 614.71 L 1920 0 Z"
                    />
                    <path
                        className="wave-2"
                        opacity="0.4"
                        fill="url(#waveGradient)"
                        d="M 0 0 L 0 556.043 Q 192 637.988 384 595.379 T 768 653.452 T 1152 685.299 T 1536 575.389 T 1920 595.456 L 1920 0 Z"
                    />
                    <path
                        className="wave-3"
                        opacity="0.4"
                        fill="url(#waveGradient)"
                        d="M 0 0 L 0 619.82 Q 192 623.155 384 594.045 T 768 614.45 T 1152 551.675 T 1536 676.015 T 1920 602.245 L 1920 0 Z"
                    />
                    <path
                        className="wave-4"
                        opacity="0.4"
                        fill="url(#waveGradient)"
                        d="M 0 0 L 0 692.257 Q 192 596.549 384 569.098 T 768 567.017 T 1152 630.46 T 1536 674.656 T 1920 566.68 L 1920 0 Z"
                    />
                </g>
            </svg>
        </div>
    );
};

export default AnimatedWave;
