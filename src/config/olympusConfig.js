/**
 * Olympus 3D Portfolio - Master Configuration
 * Defines camera path waypoints, thrones, routes, lore, and visual settings.
 */

export const OLYMPUS_CONFIG = {
  title: "ASCENT TO OLYMPUS",
  subtitle: "REALM OF THE PANTHEON",
  author: "Olympian Architect",

  // Mythological Lore displayed dynamically during loading
  loadingQuotes: [
    "Summoning the eternal mists of Mount Olympus...",
    "Harmonizing celestial spheres and star dust...",
    "Forging the golden thrones upon the highest summit...",
    "Channelling the divine fire of Prometheus...",
    "Opening the gilded gates of the Pantheon..."
  ],

  // Camera Flythrough Path (CatmullRomCurve3 coordinates)
  flythrough: {
    duration: 5.5, // seconds
    ease: "power2.inOut",
    baseFOV: 50,
    maxFOV: 64,
    // Camera position curve waypoints
    positionWaypoints: [
      [0, 2.8, 140],   // 1. Skimming low just above the ocean surface
      [0, 6.0, 95],    // 2. Accelerating over open waters toward mountain base
      [0, 28.0, 48],   // 3. Arcing upward, entering the mid-altitude cloud layer
      [0, 65.0, 10],   // 4. Steep ascent climbing alongside the rocky cliffs
      [0, 92.0, -22],  // 5. Emerging above the clouds near the golden summit
      [0, 95.0, -36]   // 6. Settling gracefully at the Throne Sanctuary
    ],
    // Look-At target curve waypoints
    targetWaypoints: [
      [0, 10.0, 70],   // 1. Looking out at distant mountain silhouette
      [0, 26.0, 25],   // 2. Looking up toward the glowing cloud layer
      [0, 58.0, -10],  // 3. Looking along the rising cliff face
      [0, 85.0, -40],  // 4. Looking directly toward the golden peak
      [0, 95.0, -55],  // 5. Focusing onto the Pantheon sanctuary
      [0, 95.0, -55]   // 6. Locked onto the Throne semi-circle
    ]
  },

  // Mountain & World Geometry
  world: {
    mountainPosition: [0, 0, -55],
    mountainHeight: 96,
    cloudLayerAltitude: 45,
    waterLevel: 0,
    fogColor: "#0B1528",
    fogDensity: 0.0055,
    sunPosition: [40, 120, -110],
    sunColor: "#FDE047"
  },

  // Peak Thrones Configuration (Interactive navigation destinations for Phase 3)
  thrones: [
    {
      id: "zeus",
      god: "Zeus",
      title: "The Sovereign",
      section: "About Me",
      route: "/about",
      color: "#FDE047",
      glowColor: "#E5A93C",
      position: [-10, 95, -53],
      rotation: [0, 0.4, 0],
      description: "Architect of scalable systems, master of vision & divine craft."
    },
    {
      id: "apollo",
      god: "Apollo",
      title: "God of Light & Arts",
      section: "Creations & Projects",
      route: "/projects",
      color: "#F59E0B",
      glowColor: "#D97706",
      position: [-5, 95, -56],
      rotation: [0, 0.2, 0],
      description: "Illuminating digital experiences with cutting-edge 3D & interactive design."
    },
    {
      id: "athena",
      god: "Athena",
      title: "Goddess of Wisdom",
      section: "Skills & Mastery",
      route: "/skills",
      color: "#38BDF8",
      glowColor: "#0284C7",
      position: [0, 95.5, -57],
      rotation: [0, 0, 0],
      description: "Tactical mastery in React, WebGL, Full-Stack Architecture & Performance."
    },
    {
      id: "hermes",
      god: "Hermes",
      title: "The Swift Messenger",
      section: "Reach the Oracle",
      route: "/contact",
      color: "#34D399",
      glowColor: "#059669",
      position: [5, 95, -56],
      rotation: [0, -0.2, 0],
      description: "Send swift digital dispatches across the mortal & immortal realms."
    },
    {
      id: "poseidon",
      god: "Poseidon",
      title: "Lord of the Depths",
      section: "Archive & Experiments",
      route: "/archive",
      color: "#60A5FA",
      glowColor: "#2563EB",
      position: [10, 95, -53],
      rotation: [0, -0.4, 0],
      description: "Navigating deep experiments, shaders, and uncharted code."
    }
  ]
};
