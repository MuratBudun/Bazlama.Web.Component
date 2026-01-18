import { LLMChatRequest, LLMResult, LLMChatStreamChunk, LLMChatStreamStats } from "./llm-chat-request"

export type StreamChunkCallback = (chunk: LLMChatStreamChunk) => void
export type StreamStatsCallback = (stats: LLMChatStreamStats) => void
export type StreamErrorCallback = (error: Error) => void
export type StreamCompleteCallback = (fullText: string) => void

export class LlmChatClient {
    private baseUrl: string

    constructor(baseUrl: string = "http://localhost:8088") {
        this.baseUrl = baseUrl
    }

    /**
     * Send a non-streaming chat request to the LLM API
     * @param request The chat request
     * @returns Promise with the LLM result
     */
    async chat(request: LLMChatRequest): Promise<LLMResult> {
        try {
            const response = await fetch(`${this.baseUrl}/llm/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(request),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.detail || "Failed to get chat completion")
            }

            return (await response.json()) as LLMResult
        } catch (error) {
            console.error("Chat request failed:", error)
            throw error
        }
    }

    /**
     * Stream a chat request to the LLM API using Server-Sent Events
     * @param request The chat request
     * @param callbacks Callback handlers for the streaming response
     * @returns A function that can be called to abort the stream
     */
    streamChat(
        request: LLMChatRequest,
        callbacks: {
            onChunk?: StreamChunkCallback
            onStats?: StreamStatsCallback
            onError?: StreamErrorCallback
            onComplete?: StreamCompleteCallback
        }
    ): () => void {
        const { onChunk, onStats, onError, onComplete } = callbacks
        let fullText = ""
        const controller = new AbortController()
        const { signal } = controller

        ;(async () => {
            try {
                const response = await fetch(`${this.baseUrl}/llm/chat/qmex-ai-test/stream`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(request),
                    signal,
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(errorData.detail || "Stream request failed")
                }

                const reader = response.body?.getReader()
                if (!reader) {
                    throw new Error("Response body is not readable")
                }

                const decoder = new TextDecoder()
                let buffer = ""

                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    // Decode the chunk and add it to the buffer
                    buffer += decoder.decode(value, { stream: true })

                    // Process complete SSE messages from the buffer
                    const messages = buffer.split("\n\n")
                    buffer = messages.pop() || "" // Last part might be incomplete

                    for (const message of messages) {
                        if (message.trim() === "") continue

                        // Extract data from SSE format
                        const dataMatch = message.match(/^data: (.+)$/m)
                        if (!dataMatch) continue

                        try {
                            const data = JSON.parse(dataMatch[1])

                            if (data.type === "stats") {
                                // This is a stats message
                                if (onStats) {
                                    onStats(data as LLMChatStreamStats)
                                }

                                if (data.complete && onComplete) {
                                    onComplete(fullText)
                                }
                            } else if (data.content) {
                                // This is a content chunk
                                fullText += data.content
                                if (onChunk) {
                                    onChunk(data as LLMChatStreamChunk)
                                }
                            } else if (data.error) {
                                // This is an error message
                                if (onError) {
                                    onError(new Error(data.error))
                                }
                            }
                        } catch (e) {
                            console.error("Error parsing SSE message:", e)
                            if (onError) {
                                onError(new Error("Failed to parse server message"))
                            }
                        }
                    }
                }
            } catch (error: unknown) {
                if (error instanceof Error && error.name !== "AbortError" && onError) {
                    onError(error)
                } else if (onError) {
                    onError(new Error("An unknown error occurred"))
                }
            }
        })()

        // Return a function that can abort the stream
        return () => controller.abort()
    }

    /**
     * Stream a chat request to the LLM API using Server-Sent Events
     * @param request The chat request
     * @param callbacks Callback handlers for the streaming response
     * @returns A function that can be called to abort the stream
     */
    streamPipe(
        user_prompt: string,
        callbacks: {
            onChunk?: StreamChunkCallback
            onStats?: StreamStatsCallback
            onError?: StreamErrorCallback
            onComplete?: StreamCompleteCallback
        }
    ): () => void {
        const { onChunk, onStats, onError, onComplete } = callbacks
        let fullText = ""
        const controller = new AbortController()
        const { signal } = controller

        ;(async () => {
            try {
                const response = await fetch(`${this.baseUrl}/test/pipe/test2?user_prompt=Merhaba`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    //body: JSON.stringify({"user_prompt": user_prompt}),
                    signal,
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(errorData.detail || "Stream request failed")
                }

                const reader = response.body?.getReader()
                if (!reader) {
                    throw new Error("Response body is not readable")
                }

                const decoder = new TextDecoder()
                let buffer = ""

                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    // Decode the chunk and add it to the buffer
                    buffer += decoder.decode(value, { stream: true })

                    // Process complete SSE messages from the buffer
                    const messages = buffer.split("\n\n")
                    buffer = messages.pop() || "" // Last part might be incomplete

                    for (const message of messages) {
                        if (message.trim() === "") continue

                        // Extract data from SSE format
                        const dataMatch = message.match(/^data: (.+)$/m)
                        if (!dataMatch) continue

                        try {
                            const data = JSON.parse(dataMatch[1])

                            if (data.type === "stats") {
                                // This is a stats message
                                if (onStats) {
                                    onStats(data as LLMChatStreamStats)
                                }

                                if (data.complete && onComplete) {
                                    onComplete(fullText)
                                }
                            } else if (data.content) {
                                // This is a content chunk
                                fullText += data.content
                                if (onChunk) {
                                    onChunk(data as LLMChatStreamChunk)
                                }
                            } else if (data.error) {
                                // This is an error message
                                if (onError) {
                                    onError(new Error(data.error))
                                }
                            }
                        } catch (e) {
                            console.error("Error parsing SSE message:", e)
                            if (onError) {
                                onError(new Error("Failed to parse server message"))
                            }
                        }
                    }
                }
            } catch (error: unknown) {
                if (error instanceof Error && error.name !== "AbortError" && onError) {
                    onError(error)
                } else if (onError) {
                    onError(new Error("An unknown error occurred"))
                }
            }
        })()

        // Return a function that can abort the stream
        return () => controller.abort()
    }    
}

// Create and export a singleton instance with the default base URL
export const llmChatClient = new LlmChatClient()
