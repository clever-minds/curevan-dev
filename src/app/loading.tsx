
import { cn } from '@/lib/utils';

const AnimatedLogo = () => (
  <svg
    id="Layer_2"
    data-name="Layer 2"
    xmlns="http://www.w3.org/2000/svg"
    width="150"
    height="150"
    viewBox="0 0 241.62 241.62"
    className="animate-pulse-strong logo-svg"
  >
    <defs>
      <linearGradient id="loading-gradient" x1="75.6" y1="56.59" x2="195.84" y2="176.83" gradientUnits="userSpaceOnUse">
        <stop className="stop1" offset="0"/>
        <stop className="stop1" offset=".41"/>
        <stop className="stop2" offset=".74"/>
        <stop className="stop2" offset="1"/>
      </linearGradient>
    </defs>
    <g>
        <path d="M128.42,66.97c-21.44,0-38.87,16.28-38.87,36.3,0,24.84,34.78,61.3,36.26,62.84,1.39,1.45,3.82,1.45,5.21,0,1.48-1.54,36.27-38,36.27-62.84,0-20.02-17.44-36.3-38.87-36.3ZM148.14,95.83v14.35h-12.55v12.55h-14.35v-12.55h-12.55v-14.35h12.55v-12.56h14.35v12.56h12.55Z" style={{fill: "url(#loading-gradient)", strokeWidth: '0px'}}/>
        <path d="M128.89,186.11s-57.73-38.97-57.73-78.54c0-31.88,25.29-57.82,56.37-57.82,20.02,0,37.65,10.76,47.64,26.95l22.52-15.73c-14.92-23.55-40.8-39.16-70.16-39.16-46.1,0-83.61,38.48-83.61,85.76,0,24.13,12.42,49.01,36.92,73.94,16.18,16.47,32.39,27.48,33.07,27.94l15.34,10.36,15.11-10.7c.65-.46,16.19-11.53,31.67-28.07,8.46-9.03,15.41-18.06,20.82-27.01l-20.05-14.49c-1.23-.89-2.92-.53-3.72.76-16.02,25.86-44.2,45.82-44.2,45.82Z" style={{fill: "url(#loading-gradient)", strokeWidth: '0px'}}/>
    </g>
  </svg>
);


export default function Loading() {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <AnimatedLogo />
    </div>
  );
}
