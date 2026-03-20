export const $socket = {
  private() {
    return {
      listen() {
        return this
      }
    }
  },
  leave(_channel: string) {}
}
