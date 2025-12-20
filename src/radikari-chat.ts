import { LitElement, css, html } from "lit";
import { customElement, property, state, query } from "lit/decorators.js";
import snarkdown from "snarkdown";
import { ApiClient, ApiError } from "./lib/api";
import type { ChatMessage } from "./lib/api";
import { Storage } from "./lib/storage";
import { themeTokens } from "./styles/tokens";

/**
 * Radikari Chat Web Component
 * A portable, non-invasive RAG chatbot interface.
 */
@customElement("radikari-chat")
export class RadikariChat extends LitElement {
  @property({ type: String, attribute: "tenant-id" }) tenantId = "";
  @property({ type: String }) lang: "id" | "en" = "id";
  @property({ type: Boolean }) inline = false;
  @property({ type: String }) theme: "light" | "dark" = "light";

  @state() private messages: ChatMessage[] = [];
  @state() private isStreaming = false;
  @state() private error: string | null = null;
  @state() private isEntering = false;
  @state() private isExpanded = false;
  @state() private inputValue = "";

  // Internal API base URL - not exposed as a prop
  private get apiBaseUrl(): string {
    const isDevelopment =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.includes("dev");

    return isDevelopment
      ? "http://localhost:3010"
      : "https://radikari-be.withsummon.com";
  }

  @query("textarea") private textarea!: HTMLTextAreaElement;

  private abortController: AbortController | null = null;

  /**
   * Parse markdown content to HTML using snarkdown
   */
  private parseMarkdown(content: string): string {
    if (!content) return "";
    try {
      return snarkdown(content);
    } catch (error) {
      console.warn("Failed to parse markdown:", error);
      return content; // Return original content if parsing fails
    }
  }

  connectedCallback() {
    super.connectedCallback();
    console.log("RadikariChat: connectedCallback fired. Attributes:", {
      tenantId: this.tenantId,
      apiBaseUrl: this.apiBaseUrl,
      inline: this.inline,
    });
    if (this.inline) {
      this.isExpanded = true;
    }

    // Simulate the 'enter' animation from codepen
    setTimeout(() => {
      this.isEntering = true;
    }, 1000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.abortController?.abort();
  }

  private _toggleChat() {
    if (this.inline) return;
    if (this.isExpanded) {
      this._closeChat();
    } else {
      this._openChat();
    }
  }

  private _openChat() {
    this.isExpanded = true;
    setTimeout(() => {
      this.textarea?.focus();
    }, 250);
  }

  private _closeChat() {
    this.isExpanded = false;
  }

  private _handleInput(e: InputEvent) {
    this.inputValue = (e.target as HTMLTextAreaElement).value;
  }

  private _handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      this._sendMessage();
    }
  }

  private async _sendMessage(): Promise<void> {
    const text = this.inputValue.trim();
    console.log("RadikariChat: _sendMessage called with:", {
      text,
      isStreaming: this.isStreaming,
      tenantId: this.tenantId,
      apiBaseUrl: this.apiBaseUrl,
    });

    if (!text || this.isStreaming || !this.tenantId || !this.apiBaseUrl) {
      console.log("RadikariChat: Early return due to validation failure");
      return;
    }

    this.isStreaming = true;
    this.error = null;
    this.inputValue = "";

    // Optimistic user message
    const userMsg: ChatMessage = { role: "user", content: text };
    this.messages = [...this.messages, userMsg];

    this.abortController = new AbortController();

    try {
      let threadId = Storage.getThreadId(this.tenantId);
      console.log("RadikariChat: Retrieved threadId from storage:", threadId);
      console.log(
        "RadikariChat: threadId type:",
        typeof threadId,
        "threadId value:",
        threadId
      );

      // 1. Ensure thread exists
      if (!threadId || threadId === "undefined") {
        console.log("RadikariChat: No threadId found, creating new thread...");
        try {
          const thread = await ApiClient.createThread(
            this.apiBaseUrl,
            this.tenantId,
            this.abortController.signal
          );
          console.log("RadikariChat: Created thread:", thread);
          threadId = thread.threadId;
          console.log("RadikariChat: Extracted threadId:", threadId);
          if (threadId) {
            Storage.setThreadId(this.tenantId, threadId);
            console.log("RadikariChat: Stored threadId in storage");
          } else {
            console.error("RadikariChat: threadId is undefined after creation");
          }
        } catch (error) {
          console.error("RadikariChat: Error creating thread:", error);
          throw error;
        }
      }

      console.log("RadikariChat: Using threadId for sendMessage:", threadId);

      // 2. Prepare assistant placeholder
      const assistantMsg: ChatMessage = { role: "assistant", content: "" };
      this.messages = [...this.messages, assistantMsg];
      const msgIndex = this.messages.length - 1;

      // 3. Stream message
      try {
        const response = await ApiClient.sendMessageStream(
          this.apiBaseUrl,
          this.tenantId,
          threadId,
          text,
          this.abortController.signal
        );

        await this._processStream(response, msgIndex);
      } catch (e) {
        // 4. Handle Expiry/404 Recovery
        if (e instanceof ApiError && e.status === 404) {
          Storage.clearThreadId(this.tenantId);
          // Recursively retry once with fresh thread
          return this._sendMessageWithNewThread(text);
        }
        throw e;
      }
    } catch (e: any) {
      if (e.name === "AbortError") return;
      this.error = e.message || "Gagal mengirim pesan";
      console.error("Radikari Chat Error:", e);
    } finally {
      this.isStreaming = false;
      this.abortController = null;
    }
  }

  private async _sendMessageWithNewThread(text: string): Promise<void> {
    // Basic recovery: just re-run the logic which will now create a thread
    // This is simplified for Batch 12; Batch 13 will harden this.
    this.messages = this.messages.slice(0, -1); // Remove empty assistant msg
    this.inputValue = text;
    return this._sendMessage();
  }

  private async _processStream(response: Response, msgIndex: number) {
    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let assistantText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      console.log("RadikariChat: Stream chunk:", chunk);

      // Parse Server-Sent Events format
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.substring(6));
            console.log("RadikariChat: Parsed stream data:", data);

            if (data.type === "text-delta" && data.delta) {
              assistantText += data.delta;
              this.messages[msgIndex].content = assistantText;
              this.requestUpdate(); // Trigger re-render for stream
              console.log(
                "RadikariChat: Updated assistant text:",
                assistantText
              );
            }
          } catch (e) {
            console.log("RadikariChat: Failed to parse stream data:", line, e);
            /* ignore partial json */
          }
        }
      }
    }
  }

  render() {
    const isFloating = !this.inline;
    return html`
      <div
        class="floating-chat ${this.isEntering ? "enter" : ""} ${this.isExpanded
          ? "expand"
          : ""} ${this.inline ? "inline" : ""} theme-${this.theme}"
      >
        ${isFloating && !this.isExpanded
          ? html`
              <div class="trigger-icon" @click=${this._toggleChat}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                  ></path>
                </svg>
              </div>
            `
          : ""}

        <div class="chat ${this.isExpanded || this.inline ? "enter" : ""}">
          <div class="header">
            <span class="title">Radikari Assistant</span>
            ${isFloating
              ? html`
                  <button @click=${this._closeChat}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                `
              : ""}
          </div>

          <ul class="messages">
            ${this.messages.length === 0
              ? html`
                  <li class="empty">Apa yang bisa saya bantu hari ini?</li>
                `
              : ""}
            ${this.messages.map(
              (m) => html`
                <li class="${m.role === "user" ? "self" : "other"}">
                  <div class="avatar">
                    ${m.role === "user"
                      ? html`
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                          >
                            <path
                              d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                            ></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                        `
                      : html`
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                          >
                            <rect
                              x="3"
                              y="11"
                              width="18"
                              height="10"
                              rx="2"
                            ></rect>
                            <circle cx="12" cy="5" r="2"></circle>
                            <path d="M12 7v4"></path>
                            <line x1="8" y1="16" x2="8" y2="16"></line>
                            <line x1="16" y1="16" x2="16" y2="16"></line>
                          </svg>
                        `}
                  </div>
                  <div class="content">
                    ${m.content
                      ? html`<div
                          .innerHTML=${this.parseMarkdown(m.content)}
                        ></div>`
                      : this.isStreaming && m.role === "assistant"
                      ? "..."
                      : ""}
                  </div>
                </li>
              `
            )}
            ${this.error ? html`<li class="error">${this.error}</li>` : ""}
          </ul>

          <div class="footer">
            <textarea
              placeholder="Ketik pesan..."
              .value=${this.inputValue}
              @input=${this._handleInput}
              @keydown=${this._handleKeyDown}
              ?disabled=${this.isStreaming}
            ></textarea>
            <button
              id="sendMessage"
              @click=${this._sendMessage}
              ?disabled=${this.isStreaming || !this.inputValue.trim()}
            >
              ${this.isStreaming ? "..." : "➤"}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  static styles = [
    themeTokens,
    css`
      @import url("https://fonts.googleapis.com/css?family=Noto+Sans");

      :host {
        --chat-thread-bgd-color: rgba(25, 147, 147, 0.2);
        --chat-thread-avatar-size: 25px;
        --chat-thread-offset: 45px;
        --radikari-accent-rgb: 25, 147, 147;
        font-family: "Noto Sans", sans-serif;
        display: block;
        z-index: 9999;
      }

      /* Theme Variables */
      .floating-chat.theme-light {
        --chat-bg-gradient: linear-gradient(to bottom, #ffffff, #f0f2f5);
        --chat-header-text: #183850;
        --chat-msg-self-bg: rgba(25, 147, 147, 0.1);
        --chat-msg-self-text: #183850;
        --chat-msg-other-text: #192c46;
        --chat-footer-bg: #f9f9f9;
        --chat-input-bg: #ffffff;
        --chat-input-text: #183850;
        --chat-icon-color: #183850;
        --chat-trigger-bg: linear-gradient(-45deg, #183850 0, #192c46 100%);
      }

      .floating-chat.theme-dark {
        --chat-bg-gradient: linear-gradient(
          -45deg,
          #183850 0,
          #183850 25%,
          #192c46 50%,
          #22254c 75%,
          #22254c 100%
        );
        --chat-header-text: white;
        --chat-msg-self-bg: rgba(25, 147, 147, 0.2);
        --chat-msg-self-text: white;
        --chat-msg-other-text: white;
        --chat-footer-bg: transparent;
        --chat-input-bg: rgba(25, 147, 147, 0.2);
        --chat-input-text: white;
        --chat-icon-color: white;
        --chat-trigger-bg: linear-gradient(-45deg, #183850 0, #22254c 100%);
      }

      * {
        box-sizing: border-box;
      }

      .floating-chat {
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 56px;
        height: 56px;
        transform: translateY(70px);
        transition: all 250ms ease-out;
        border-radius: 50%;
        opacity: 0;
        background: var(--chat-trigger-bg);
        box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.12),
          0px 1px 2px rgba(0, 0, 0, 0.14);
      }

      .floating-chat.inline {
        position: relative;
        bottom: 0;
        right: 0;
        transform: none;
        opacity: 1;
        width: 100%;
        height: 500px;
        border-radius: 12px;
        cursor: auto;
      }

      .floating-chat.enter {
        transform: translateY(0);
        opacity: 0.6;
      }

      .floating-chat.enter:hover {
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.19),
          0 6px 6px rgba(0, 0, 0, 0.23);
        opacity: 1;
      }

      .floating-chat.expand {
        width: 360px;
        max-height: 500px;
        height: 500px;
        border-radius: 12px;
        cursor: auto;
        opacity: 1;
        background: var(--chat-bg-gradient);
      }

      .trigger-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
      }

      .chat {
        display: none;
        flex-direction: column;
        width: 100%;
        height: 100%;
        padding: 10px;
        transition: all 250ms ease-out;
      }

      .chat.enter {
        display: flex;
      }

      .header {
        flex-shrink: 0;
        padding-bottom: 10px;
        display: flex;
        align-items: center;
        background: transparent;
      }

      .header .title {
        flex-grow: 1;
        font-size: 14px;
        font-weight: bold;
        text-transform: uppercase;
        padding: 0 5px;
        color: var(--chat-header-text);
      }

      .header button {
        background: transparent;
        border: 0;
        color: var(--chat-header-text);
        cursor: pointer;
        padding: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .messages {
        padding: 10px;
        margin: 0;
        list-style: none;
        overflow-y: scroll;
        overflow-x: hidden;
        flex-grow: 1;
        border-radius: 4px;
        background: transparent;
        display: flex;
        flex-direction: column;
      }

      /* Custom Scrollbar */
      .messages::-webkit-scrollbar {
        width: 5px;
      }
      .messages::-webkit-scrollbar-track {
        border-radius: 5px;
        background-color: rgba(25, 147, 147, 0.1);
      }
      .messages::-webkit-scrollbar-thumb {
        border-radius: 5px;
        background-color: var(--chat-thread-bgd-color);
      }

      .messages li {
        position: relative;
        clear: both;
        display: flex;
        padding: 12px;
        margin: 0 0 25px 0;
        font-size: 12px;
        line-height: 1.4;
        word-wrap: break-word;
        max-width: 90%;
      }

      .messages li .avatar {
        position: absolute;
        top: 0;
        width: var(--chat-thread-avatar-size);
        height: var(--chat-thread-avatar-size);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.1);
        padding: 4px;
      }

      .messages li .avatar svg {
        width: 100%;
        height: 100%;
        color: var(--chat-icon-color);
      }

      /* User Message (Self) - Using Intercom style "other" from codepen */
      .messages li.self {
        align-self: flex-end;
        margin-right: var(--chat-thread-offset);
        color: var(--chat-msg-self-text);
        background-color: var(--chat-msg-self-bg);
        border-radius: 10px;
        animation: show-chat-odd 0.15s 1 ease-in;
      }

      .messages li.self .avatar {
        right: calc(-1 * var(--chat-thread-offset));
      }

      .messages li.self:after {
        position: absolute;
        top: 10px;
        content: "";
        width: 0;
        height: 0;
        border-top: 10px solid var(--chat-msg-self-bg);
        border-right: 10px solid transparent;
        right: -10px;
      }

      /* AI Message (Other) - Using Intercom style "self" from codepen but no bubble */
      .messages li.other {
        align-self: flex-start;
        margin-left: var(--chat-thread-offset);
        color: var(--chat-msg-other-text);
        background-color: transparent; /* No bubble for AI */
        padding: 0;
        animation: show-chat-even 0.15s 1 ease-in;
      }

      .messages li.other .avatar {
        left: calc(-1 * var(--chat-thread-offset));
      }

      .messages li.other .content {
        padding: 0;
      }

      .footer {
        flex-shrink: 0;
        display: flex;
        padding-top: 10px;
        max-height: 90px;
        background: var(--chat-footer-bg);
        gap: 5px;
      }

      .footer textarea {
        flex: 1;
        border-radius: 3px;
        background: var(--chat-input-bg);
        border: 1px solid rgba(0, 0, 0, 0.1);
        color: var(--chat-input-text);
        padding: 8px;
        font-family: inherit;
        font-size: 12px;
        resize: none;
        outline: none;
      }

      .theme-dark .footer textarea {
        border: none;
        background: var(--chat-input-bg);
      }

      .footer button {
        background: transparent;
        border: 0;
        color: var(--chat-header-text);
        text-transform: uppercase;
        border-radius: 3px;
        cursor: pointer;
        padding: 0 10px;
        font-weight: bold;
      }

      .footer button:hover {
        opacity: 0.8;
      }

      .empty {
        text-align: center;
        color: rgba(255, 255, 255, 0.5);
        margin-top: 40px;
        font-size: 12px;
      }

      .error {
        color: #ff4d4f;
        font-size: 11px;
        text-align: center;
        padding: 10px;
      }

      /* Markdown Content Styling */
      .content p {
        margin: 0 0 8px 0;
        line-height: 1.5;
      }

      .content p:last-child {
        margin-bottom: 0;
      }

      .content strong {
        font-weight: bold;
        color: var(--chat-msg-other-text);
      }

      .content em {
        font-style: italic;
      }

      .content code {
        background: rgba(25, 147, 147, 0.1);
        padding: 2px 4px;
        border-radius: 3px;
        font-family: "Courier New", monospace;
        font-size: 11px;
        color: var(--chat-msg-other-text);
      }

      .content pre {
        background: rgba(25, 147, 147, 0.05);
        border: 1px solid rgba(25, 147, 147, 0.2);
        border-radius: 4px;
        padding: 8px;
        margin: 8px 0;
        overflow-x: auto;
        font-family: "Courier New", monospace;
        font-size: 11px;
        line-height: 1.4;
      }

      .content pre code {
        background: none;
        padding: 0;
        border-radius: 0;
        font-size: inherit;
      }

      .content ul,
      .content ol {
        margin: 8px 0;
        padding-left: 20px;
      }

      .content li {
        margin: 4px 0;
        line-height: 1.4;
      }

      .content blockquote {
        border-left: 3px solid rgba(25, 147, 147, 0.3);
        padding-left: 12px;
        margin: 8px 0;
        font-style: italic;
        color: var(--chat-msg-other-text);
      }

      .content a {
        color: rgba(25, 147, 147, 0.8);
        text-decoration: none;
      }

      .content a:hover {
        text-decoration: underline;
      }

      .content h1,
      .content h2,
      .content h3,
      .content h4,
      .content h5,
      .content h6 {
        margin: 12px 0 8px 0;
        font-weight: bold;
        color: var(--chat-msg-other-text);
      }

      .content h1 {
        font-size: 14px;
      }
      .content h2 {
        font-size: 13px;
      }
      .content h3 {
        font-size: 12px;
      }
      .content h4,
      .content h5,
      .content h6 {
        font-size: 12px;
      }

      @keyframes show-chat-even {
        0% {
          margin-left: -480px;
        }
        100% {
          margin-left: var(--chat-thread-offset);
        }
      }

      @keyframes show-chat-odd {
        0% {
          margin-right: -480px;
        }
        100% {
          margin-right: var(--chat-thread-offset);
        }
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "radikari-chat": RadikariChat;
  }
}
