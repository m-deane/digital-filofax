import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Digital Filofax",
    short_name: "Filofax",
    description: "Your personal digital planner for everyday life",
    start_url: "/dashboard/daily",
    display: "standalone",
    background_color: "#fdfaf5",
    theme_color: "#0f172a",
    orientation: "portrait",
    scope: "/",
    icons: [
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
