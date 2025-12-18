/**
 * API Client for Radikari Ephemeral Chat.
 * Handles thread lifecycle and streaming interactions.
 */

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ThreadResponse {
  threadId: string;
  tenantId: string;
  expiresAt: string;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export const ApiClient = {
  /**
   * Creates a new ephemeral thread.
   */
  async createThread(
    baseUrl: string,
    tenantId: string,
    signal?: AbortSignal
  ): Promise<ThreadResponse> {
    const response = await fetch(
      `${baseUrl}/ephemeral/tenants/${tenantId}/threads`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal,
      }
    );

    if (!response.ok) {
      throw new ApiError(response.status, "Failed to create chat thread");
    }

    const result = await response.json();
    console.log("ApiClient: Thread creation response:", result);

    if (!result.content) {
      console.error("ApiClient: No content field in response:", result);
      throw new ApiError(response.status, "Invalid thread creation response");
    }

    if (!result.content.threadId) {
      console.error(
        "ApiClient: No threadId in response content:",
        result.content
      );
      throw new ApiError(response.status, "No threadId in response");
    }

    return result.content;
  },

  /**
   * Sends a message to an existing thread.
   * Returns the raw Response object for stream processing.
   */
  async sendMessageStream(
    baseUrl: string,
    tenantId: string,
    threadId: string,
    message: string,
    signal?: AbortSignal
  ): Promise<Response> {
    const response = await fetch(
      `${baseUrl}/ephemeral/tenants/${tenantId}/threads/${threadId}/stream`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: message,
            },
          ],
        }),
        signal,
      }
    );

    if (response.status === 404) {
      throw new ApiError(404, "Thread expired or not found");
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(
        response.status,
        errorText || "Failed to send message"
      );
    }

    return response;
  },
};
