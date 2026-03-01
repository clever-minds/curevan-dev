
import { cn } from "@/lib/utils";

const Logo = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
       <svg
        id="Layer_2"
        data-name="Layer 2"
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="38"
        viewBox="0 0 107.83 139.37"
        className="logo-svg"
      >
        <defs>
          <linearGradient id="logoGradient" x1="22.36" y1="24.55" x2="107.23" y2="109.43" gradientUnits="userSpaceOnUse">
            <stop className="stop1" offset="0"/>
            <stop className="stop1" offset=".41"/>
            <stop className="stop2" offset=".74"/>
            <stop className="stop2" offset="1"/>
          </linearGradient>
        </defs>
        <g id="Layer_1-2" data-name="Layer 1">
          <g>
            <path d="M59.64,31.87c-15.13,0-27.44,11.49-27.44,25.62,0,17.53,24.55,43.27,25.6,44.36.98,1.02,2.7,1.02,3.68,0,1.05-1.08,25.6-26.83,25.6-44.36,0-14.13-12.31-25.62-27.44-25.62ZM73.57,60.63c0,.96-.78,1.75-1.75,1.75h-7.11v7.11c0,.97-.79,1.75-1.75,1.75h-6.63c-.97,0-1.75-.78-1.75-1.75v-7.11h-7.11c-.97,0-1.75-.79-1.75-1.75v-6.63c0-.97.78-1.75,1.75-1.75h7.11v-7.12c0-.96.78-1.75,1.75-1.75h6.63c.96,0,1.75.79,1.75,1.75v7.12h7.11c.97,0,1.75.78,1.75,1.75v6.63Z" style={{fill: "url(#logoGradient)", strokeWidth: "0px"}}/>
            <path d="M61.04,115.2c-.64.48-1.49.49-2.14.02-6.45-4.59-39.67-29.47-39.67-54.68,0-22.5,17.85-40.81,39.79-40.81,13.47,0,25.41,6.91,32.61,17.45.58.86,1.72,1.08,2.56.49l12.83-8.96c.85-.59,1.07-1.79.48-2.65C96.83,10.32,79.08,0,59.02,0,26.48,0,0,27.16,0,60.54c0,17.04,8.77,34.59,26.06,52.19,11.42,11.63,22.86,19.39,23.35,19.72l9.79,6.61c.63.42,1.45.42,2.07-.02l9.64-6.83c.46-.33,11.43-8.14,22.36-19.81,5.49-5.86,10.07-11.71,13.74-17.52.54-.86.33-2-.49-2.59l-12.71-9.19c-.86-.62-2.06-.38-2.63.54-9.75,15.73-25.88,28.37-30.14,31.56Z" style={{fill: "url(#logoGradient)", strokeWidth: "0px"}}/>
          </g>
        </g>
      </svg>
    </div>
  );
};

export default Logo;
