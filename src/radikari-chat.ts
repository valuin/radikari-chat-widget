import { LitElement, css, html } from "lit";
import { customElement, property, state, query } from "lit/decorators.js";
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
  @property({ type: String, attribute: "api-base-url" }) apiBaseUrl = "";
  @property({ type: String }) lang: "id" | "en" = "id";
  @property({ type: Boolean }) inline = false;

  @state() private messages: ChatMessage[] = [];
  @state() private isStreaming = false;
  @state() private error: string | null = null;
  @state() private isOpen = false;
  @state() private inputValue = "";

  @query("textarea") private!: HTMLTextAreaElement;

  private abortController: AbortController | null = null;

  connectedCallback() {
    super.connectedCallback();
    console.log("RadikariChat: connectedCallback fired. Attributes:", {
      tenantId: this.tenantId,
      apiBaseUrl: this.apiBaseUrl,
      inline: this.inline,
    });
    this.isOpen = this.inline;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.abortController?.abort();
  }

  private _toggleChat() {
    if (this.inline) return;
    this.isOpen = !this.isOpen;
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
    console.log("RadikariChat: render method called. isOpen:", this.isOpen);
    return html`
      <div
        class="wrapper ${this.isOpen ? "open" : ""} ${this.inline
          ? "inline"
          : "floating"}"
      >
        ${!this.inline
          ? html`
              <button class="trigger" @click=${this._toggleChat}>
                ${this.isOpen ? "✕" : "💬"}
              </button>
            `
          : ""}

        <div class="container">
          <div class="header">
            <h3>Radikari Assistant</h3>
          </div>

          <div class="messages" id="scroll-target">
            ${this.messages.length === 0
              ? html`
                  <div class="empty">Apa yang bisa saya bantu hari ini?</div>
                `
              : ""}
            ${this.messages.map(
              (m) => html`
                <div class="message ${m.role}">
                  <div class="bubble">
                    ${m.content ||
                    (this.isStreaming && m.role === "assistant" ? "..." : "")}
                  </div>
                </div>
              `
            )}
            ${this.error ? html`<div class="error">${this.error}</div>` : ""}
          </div>

          <div class="input-area">
            <textarea
              placeholder="Ketik pesan..."
              .value=${this.inputValue}
              @input=${this._handleInput}
              @keydown=${this._handleKeyDown}
              ?disabled=${this.isStreaming}
            ></textarea>
            <button
              class="send"
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
      :host {
        --radikari-text: #1a1a1a;
        --radikari-radius: 12px;
        font-family: var(--radikari-font);
        display: block;
        z-index: 9999;
        /* Ensure host has dimensions in inline mode */
        min-height: var(--radikari-min-height, auto);
      }

      .wrapper {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      .wrapper.floating {
        position: fixed;
        bottom: 20px;
        right: 20px;
      }

      .trigger {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: var(--radikari-accent);
        color: white;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        font-size: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s;
      }

      .trigger:hover {
        transform: scale(1.05);
      }

      .container {
        display: none;
        width: 360px;
        height: 500px;
        background: var(--radikari-bg);
        border-radius: var(--radikari-radius);
        flex-direction: column;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        overflow: hidden;
        border: 1px solid #eee;
      }

      .wrapper.open .container {
        display: flex;
      }
      .wrapper.inline {
        min-height: 500px; /* Default height for inline testing */
      }

      .wrapper.inline .container {
        display: flex;
        box-shadow: none;
        border: 1px solid #eee;
        width: 100%;
        flex: 1; /* Take all available space in the wrapper */
      }

      .header {
        padding: 16px;
        background: var(--radikari-accent);
        color: white;
      }

      .header h3 {
        margin: 0;
        font-size: 16px;
      }

      .messages {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: var(--_msg-gap);
        background: #f9f9f9;
      }

      .empty {
        text-align: center;
        color: #888;
        margin-top: 40px;
        font-size: 14px;
      }

      .message {
        display: flex;
        width: 100%;
      }
      .message.user {
        justify-content: flex-end;
      }

      .bubble {
        max-width: 80%;
        padding: 10px 14px;
        border-radius: 18px;
        font-size: 14px;
        line-height: 1.4;
        white-space: pre-wrap;
      }

      .user .bubble {
        background: var(--radikari-accent);
        color: white;
        border-bottom-right-radius: 4px;
      }
      .assistant .bubble {
        background: white;
        color: var(--radikari-text);
        border-bottom-left-radius: 4px;
        border: 1px solid #eee;
      }

      .input-area {
        padding: 12px;
        display: flex;
        gap: 8px;
        background: white;
        border-top: 1px solid #eee;
      }

      textarea {
        flex: 1;
        border: 1px solid #eee;
        border-radius: 8px;
        padding: 8px;
        resize: none;
        height: 40px;
        font-family: inherit;
        outline: none;
      }

      textarea:focus {
        border-color: var(--radikari-accent);
      }

      .send {
        background: var(--radikari-accent);
        color: white;
        border: none;
        border-radius: 8px;
        width: 40px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .error {
        color: #ff4d4f;
        font-size: 12px;
        text-align: center;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "radikari-chat": RadikariChat;
  }
}
