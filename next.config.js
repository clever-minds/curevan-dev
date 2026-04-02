/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,   
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.elitecarehc.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/uploads/**",

      },
      {
        protocol: 'https',
        hostname: '13.235.132.236',
        port: '',           // agar default 443 hai
        pathname: '/uploads/images/**',
      },
      {
        protocol: 'https',
        hostname: '13.234.126.66',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'api.curevan.com',
        pathname: '/uploads/**',

      }
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com https://www.google.com https://www.gstatic.com https://maps.googleapis.com https://www.googletagmanager.com;",
          },
        ],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/discover',
        destination: '/book',
        permanent: true,
      },
      {
        source: '/ecommerce',
        destination: '/shop',
        permanent: true,
      },
      {
        source: '/tp/:id',
        destination: '/therapists/:id',
        permanent: true,
      },
      {
        source: '/dashboard/admin/posts',
        destination: '/dashboard/admin/journal',
        permanent: true,
      },
      {
        source: '/dashboard/ecom-admin/posts',
        destination: '/dashboard/admin/journal',
        permanent: true,
      },
      {
        source: '/dashboard/therapy-admin/posts',
        destination: '/dashboard/admin/journal',
        permanent: true,
      },
    ]
  }
};

module.exports = nextConfig;
