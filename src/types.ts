export type WebSocketAction = 'create' | 'createMany' | 'bulk' | 'update' | 'remove' | 'purge'

export interface WebSocketPayloadContext {
    action: WebSocketAction
    data: unknown
    channel?: string
    namespace?: string
    service?: string
}

export interface WebSocketOptions {
    enabled?: boolean
    channel?: string
    namespace?: string
    service?: string
    events?: Partial<Record<WebSocketAction, string>>
    buildPayload?: (context: WebSocketPayloadContext) => unknown
    throwOnError?: boolean
}
