import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mero Kirana",
    short_name: "Kirana",
    description: "Offline-first grocery store POS for Nepal",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fff8ef",
    theme_color: "#ea580c",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}