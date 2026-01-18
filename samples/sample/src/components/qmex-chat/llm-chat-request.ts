export interface LLMChatRequest {
    user_prompt: string
    system_prompt?: string
    history?: Record<string, string>
    model_name?: string
    provider_name?: string
    max_tokens?: number
    temperature?: number
    top_p?: number
    frequency_penalty?: number
    presence_penalty?: number
    stop_sequences?: string[]
    n?: number
}

export interface LLMUsage {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
}

export interface LLMResult {
    text: string
    model: string
    provider: string
    finish_reason?: string
    usage: LLMUsage
    raw_response: Record<string, any>
}

export interface LLMChatStreamChunk {
    content: string
    finish_reason?: string
    model: string
    provider: string
    usage: LLMUsage
}

export interface LLMChatStreamStats {
    type: "stats"
    model: string
    provider: string
    finish_reason?: string
    usage: LLMUsage
    complete: boolean
}
