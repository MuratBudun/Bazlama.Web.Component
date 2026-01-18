import MarkdownIt from 'markdown-it'
import { Attribute, BazlamaWebComponent, ChangeHooks, CustomElement, EventAction, ShadowRootMode, useAddRemoveClass, useCustomHook, useFunction } from "bazlama-web-component"
import htmlTemplate from "./templeate.htm"

import { llmChatClient } from './llm-chat-client';
import { LLMChatRequest } from './llm-chat-request';

@CustomElement("qmex-chat")
export default class QMexChat extends BazlamaWebComponent {
    md: MarkdownIt
    
    constructor() {
        super(ShadowRootMode.None)
        this.InitBazlamaWebComponent()
        this.md = new MarkdownIt()
        this.md.set({
            breaks: true,
            linkify: true,
            typographer: true,
            highlight: (str, lang) => {
                return `<pre><code class="language-${lang}">${str}</code></pre>`
            }
        })
        
        // Tablo render özelleştirmesi
        const defaultRender = this.md.renderer.rules.table || ((tokens, idx, options, env, self) => {
            return self.renderToken(tokens, idx, options)
        })
        
        this.md.renderer.rules.table_open = function(tokens: any[], idx: number, options: any, env: any) {
            console.log("Burasıııııı")
            console.log(tokens[idx])
            return '<table class="table">' 
        }
    }


    getRenderTemplate() {
        return htmlTemplate
    }

    afterRender() {
        const sendButton = this.root?.querySelector("button[ref='sendButton']")
        sendButton?.addEventListener("click", () => {
            //this.sendMessageStream()
            this.sendMessageStreamPipe()
        })
    }

    async sendMessageStream() {
        const input = this.root?.querySelector("input[ref='userInput']") as HTMLInputElement
        const message = input?.value.trim()
        if (!message) return;
        input.value = "";

        const chatBox = this.root?.querySelector("div[ref='chatBox']") as HTMLDivElement
        const messageDiv = document.createElement("div")
        messageDiv.innerHTML = `<div class="chat chat-end">
        <div class="chat-bubble">${message}</div>
        </div>`
        chatBox.appendChild(messageDiv)

        const responseDiv = document.createElement("div")
        responseDiv.classList.add("w-full")
        responseDiv.classList.add("p-4")
        chatBox.appendChild(responseDiv)

        const request: LLMChatRequest = {
            model_name: "qmex-gpt-4o",
            user_prompt: message,
            temperature: 0.7
        };
        
        let receivedText = ""

        const abortStream = llmChatClient.streamChat(request, {
            onChunk: (chunk) => {
                receivedText += chunk.content
                responseDiv.innerHTML = this.md.render(receivedText)
            },
            onComplete: () => {
                console.log("Stream completed")
            },
            onError: (error) => {
                console.error("Error:", error)
            },
            onStats: (stats) => {
                console.log("Stats:", stats)
            }
        });
    }


    async sendMessageStreamPipe() {
        const input = this.root?.querySelector("input[ref='userInput']") as HTMLInputElement
        const message = input?.value.trim()
        if (!message) return;
        input.value = "";

        const chatBox = this.root?.querySelector("div[ref='chatBox']") as HTMLDivElement
        const messageDiv = document.createElement("div")
        messageDiv.innerHTML = `<div class="chat chat-end">
        <div class="chat-bubble">${message}</div>
        </div>`
        chatBox.appendChild(messageDiv)

        const responseDiv = document.createElement("div")
        responseDiv.classList.add("w-full")
        responseDiv.classList.add("p-4")
        chatBox.appendChild(responseDiv)

        const request: LLMChatRequest = {
            provider_name: "qmex-ai-test",
            model_name: "qmex-gpt-4o",
            user_prompt: message,
            temperature: 0.7
        };
        
        let receivedText = ""

        const abortStream = llmChatClient.streamPipe(message, {
            onChunk: (chunk) => {
                receivedText += chunk.content
                responseDiv.innerHTML = this.md.render(receivedText)
            },
            onComplete: () => {
                console.log("Stream completed")
            },
            onError: (error) => {
                console.error("Error:", error)
            },
            onStats: (stats) => {
                console.log("Stats:", stats)
            }
        });
    }


    async sendMessage() {
        const input = this.root?.querySelector("input[ref='userInput']") as HTMLInputElement
        const message = input?.value.trim()
        if (!message) return;
        input.value = "";

        const chatBox = this.root?.querySelector("div[ref='chatBox']") as HTMLDivElement
        const messageDiv = document.createElement("div")
        messageDiv.innerHTML = `<div class="chat chat-end">
        <div class="chat-bubble">${message}</div>
        </div>`
        chatBox.appendChild(messageDiv)

        const responseDiv = document.createElement("div")
        responseDiv.classList.add("w-full")
        responseDiv.classList.add("p-4")
        chatBox.appendChild(responseDiv)
        
        // İletişim için mesajlar listesi (örnekte system mesajı da ekleniyor)
        const messages = [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: message }
        ];

        const chatRequest = {
            "user_prompt": message,
            "model_name": "qmex-gpt-4o",
        }            
        
        const chatUrl = "http://localhost:8088/llm/chat/qmex-ai-test/stream" //"http://localhost:8087/llm/chat/stream2"
        const response = await fetch(chatUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(messages)
        });

        // Gelen streaming veriyi okuyup ekrana yazdırıyoruz
        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error("Response body is empty");
        }
        const decoder = new TextDecoder("utf-8");
        let done = false;
        let responseContent = ""
        while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            const chunk = decoder.decode(value);
            if (chunk) {
                responseContent += chunk
                responseDiv.innerHTML = this.md.render(responseContent)
            }
        }
    }    
}