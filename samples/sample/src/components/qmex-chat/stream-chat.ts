export interface Message {
    role: "system" | "user" | "assistant"
    content: string
}

export interface LLMChatRequest {
    model_name?: string
    messages: Message[]
    temperature?: number
    max_tokens?: number
    stream?: boolean
}

export interface LLMChunkResponse {
    content: string
    finish_reason: string | null
    model: string
    provider: string
    usage: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
    }
}

export class LLMStreamClient {
    private readonly baseUrl: string

    constructor(baseUrl = "/api") {
        this.baseUrl = baseUrl
    }

    async streamChat(request: LLMChatRequest): Promise<ReadableStream<LLMChunkResponse>> {
        // Make sure stream is set to true
        request.stream = true
        const response = await fetch(`${this.baseUrl}/llm/chat/qmex-ai-test/stream`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(request),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(`Stream chat error: ${error.detail || response.statusText}`)
        }

        return this.parseEventStream(response)
    }

    private parseEventStream(response: Response): ReadableStream<LLMChunkResponse> {
        const reader = response.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ""

        return new ReadableStream({
            async start(controller) {
                try {
                    while (true) {
                        const { done, value } = await reader.read()

                        if (done) {
                            if (buffer.length > 0) {
                                // Process any remaining data in the buffer
                                processBuffer(buffer, controller)
                            }
                            break
                        }

                        // Decode binary data to text
                        const chunk = decoder.decode(value, { stream: true })
                        buffer += chunk

                        // Process complete SSE messages in buffer
                        processBuffer(buffer, controller)

                        // Keep any incomplete message in the buffer
                        const lastNewlineIndex = buffer.lastIndexOf("\n\n")
                        if (lastNewlineIndex !== -1) {
                            buffer = buffer.slice(lastNewlineIndex + 2)
                        }
                    }

                    controller.close()
                } catch (error) {
                    controller.error(error)
                }
            },
        })

        function processBuffer(buffer: string, controller: ReadableStreamDefaultController<LLMChunkResponse>) {
            const messages = buffer.split("\n\n")

            for (const message of messages) {
                if (!message || !message.startsWith("data: ")) continue

                try {
                    const data = JSON.parse(message.slice(6)) // Remove 'data: ' prefix
                    controller.enqueue(data)
                } catch (e) {
                    console.error("Error parsing SSE message:", e)
                }
            }
        }
    }
}
