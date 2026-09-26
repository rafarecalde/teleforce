/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverComponentsExternalPackages: ['@libsql/client'],
    // The acceptance email attaches this file. Trace it into the signup routes
    // even if the read path is not obvious to the file tracer.
    outputFileTracingIncludes: {
      '/api/signup/complete': ['./content/terms.md'],
      '/api/signup/terms': ['./content/terms.md'],
    },
  },
};

export default nextConfig;
