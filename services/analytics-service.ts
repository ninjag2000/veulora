export function track(event: string, params?: Record<string, unknown>) {
  if (__DEV__) {
    console.log(`[analytics] ${event}`, params ?? {});
  }
}
