import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "com.heymacce.app",
  appName: "heyMACCE",
  webDir: "out",

  server: {
    url: "https://heymacce.com",
    cleartext: false,
    androidScheme: "https",
  },
}

export default config
