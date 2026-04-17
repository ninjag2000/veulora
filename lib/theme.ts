export const theme = {
  colors: {
    bg: {
      app: "#0B0711",
      surface: "#15101D",
      card: "#1B1426",
      elevated: "#21172F",
      overlay: "rgba(11, 7, 17, 0.82)",
    },
    text: {
      primary: "#F6F2FF",
      secondary: "#B8AFC9",
      muted: "#857A97",
    },
    accent: {
      start: "#C86BFF",
      end: "#FF8FD8",
      soft: "#8B6BFF",
      glow: "#FF9BE0",
    },
    border: {
      subtle: "rgba(255, 255, 255, 0.08)",
      strong: "rgba(255, 255, 255, 0.18)",
    },
    feedback: {
      success: "#87D8AF",
      error: "#E6829E",
      warning: "#F2C572",
    },
    pill: "rgba(255, 255, 255, 0.06)",
    black: "#000000",
  },
  gradients: {
    primary: ["#C86BFF", "#FF8FD8"] as const,
    background: ["#0B0711", "#11081A", "#0B0711"] as const,
    overlay: ["rgba(200, 107, 255, 0.14)", "rgba(255, 143, 216, 0.02)"] as const,
  },
  radii: {
    xs: 12,
    s: 14,
    m: 20,
    l: 24,
    xl: 28,
    pill: 999,
  },
  spacing: {
    xs: 8,
    s: 12,
    m: 16,
    l: 20,
    xl: 24,
    xxl: 32,
    xxxl: 40,
  },
  typography: {
    hero: 34,
    title: 28,
    section: 20,
    body: 16,
    caption: 13,
    micro: 11,
  },
  shadows: {
    card: "0 24px 40px rgba(0, 0, 0, 0.35)",
    soft: "0 10px 24px rgba(24, 12, 38, 0.28)",
    glow: "0 0 40px rgba(200, 107, 255, 0.16)",
  },
} as const;

export type Theme = typeof theme;
