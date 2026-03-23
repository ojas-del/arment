/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placedog.net",
      },
      {
        protocol: "https",
        hostname: "www.datocms-assets.com",
      },
      {
        protocol: "https",
        hostname: "www.purepetfood.com",
      },
      {
        protocol: "https",
        hostname: "pure-website.s3.eu-west-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "dzhtpnskezkrtfinntbi.supabase.co",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
