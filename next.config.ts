import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // El panel viejo de leads vive ahora en el CRM. Solo la página: las rutas
  // hijas (/servinomic/leads/agendar, /contratos…) siguen sirviendo al CRM.
  async redirects() {
    return [{ source: "/servinomic/leads", destination: "/crm/ventas", permanent: true }];
  },
};

export default withNextIntl(nextConfig);
