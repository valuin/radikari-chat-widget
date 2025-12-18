/**
 * Namespaced storage utility for Radikari Chat Widget.
 * Uses sessionStorage to maintain ephemeral thread state.
 */

const PREFIX = "radikari_chat";

export const Storage = {
  /**
   * Generates a namespaced key for a specific tenant.
   */
  getThreadKey(tenantId: string): string {
    return `${PREFIX}:thread_id:${tenantId}`;
  },

  /**
   * Retrieves the thread ID for a specific tenant.
   */
  getThreadId(tenantId: string): string | null {
    try {
      return window.sessionStorage.getItem(this.getThreadKey(tenantId));
    } catch (e) {
      console.warn("Radikari Storage: Failed to read from sessionStorage", e);
      return null;
    }
  },

  /**
   * Saves the thread ID for a specific tenant.
   */
  setThreadId(tenantId: string, threadId: string): void {
    try {
      window.sessionStorage.setItem(this.getThreadKey(tenantId), threadId);
    } catch (e) {
      console.error("Radikari Storage: Failed to write to sessionStorage", e);
    }
  },

  /**
   * Removes the thread ID for a specific tenant.
   */
  clearThreadId(tenantId: string): void {
    try {
      window.sessionStorage.removeItem(this.getThreadKey(tenantId));
    } catch (e) {
      console.error("Radikari Storage: Failed to clear sessionStorage", e);
    }
  },
};
