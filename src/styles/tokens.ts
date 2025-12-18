import { css } from "lit";

/**
 * Shared theme tokens for the Radikari Chat component.
 * Ensures consistent look and feel while allowing host overrides.
 */
export const themeTokens = css`
  :host {
    --radikari-font: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
      Roboto, sans-serif;
    --radikari-bg: #ffffff;
    --radikari-accent: #1890ff;
    --radikari-text: #1a1a1a;
    --radikari-radius: 12px;
    --_msg-gap: 12px;
  }
`;
