import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

const nextConfig: NextConfig = {
  allowedDevOrigins: ['padded-state-unheated.ngrok-free.dev'],
  turbopack: {},
};

export default withPWA(nextConfig);
