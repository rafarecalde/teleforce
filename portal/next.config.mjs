/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverComponentsExternalPackages: ['@libsql/client', 'pdfkit'],
    // Terms markdown and the PDF fonts are read from disk when a signup email
    // is sent. Trace them into that route even if the path is dynamic.
    outputFileTracingIncludes: {
      '/api/signup/complete': [
        './content/terms.md',
        './assets/fonts/LiberationSerif-Regular.ttf',
        './assets/fonts/LiberationSerif-Bold.ttf',
        './assets/fonts/LiberationSerif-Italic.ttf',
        './assets/fonts/LiberationSerif-BoldItalic.ttf',
      ],
      '/api/signup/terms': ['./content/terms.md'],
    },
  },
};

export default nextConfig;
