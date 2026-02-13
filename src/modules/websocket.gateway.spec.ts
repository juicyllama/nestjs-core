import { Server } from 'socket.io'

const createServer = () => {
    const emit = jest.fn()
    const toEmit = jest.fn()
    const to = jest.fn(() => ({ emit: toEmit }))

    const namespaceEmit = jest.fn()
    const namespaceToEmit = jest.fn()
    const namespaceTo = jest.fn(() => ({ emit: namespaceToEmit }))

    const of = jest.fn(() => ({ emit: namespaceEmit, to: namespaceTo }))

    const server = {
        emit,
        to,
        of,
    } as unknown as Server

    return { server, emit, to, toEmit, of, namespaceEmit, namespaceTo, namespaceToEmit }
}

const loadGateway = () => {
    jest.resetModules()
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('./websocket.gateway') as typeof import('./websocket.gateway')
}

describe('WebSocketEmitter', () => {
    it('reports missing server before binding', () => {
        const { WebSocketEmitter } = loadGateway()
        expect(WebSocketEmitter.hasServer()).toBe(false)
    })

    it('does nothing when emitting without a bound server', () => {
        const { WebSocketEmitter } = loadGateway()
        expect(() => WebSocketEmitter.emit('event', { ok: true })).not.toThrow()
    })

    it('emits directly on the server when no target is provided', () => {
        const { WebSocketEmitter } = loadGateway()
        const { server, emit } = createServer()

        WebSocketEmitter.bind(server)
        WebSocketEmitter.emit('event', { ok: true })

        expect(emit).toHaveBeenCalledWith('event', { ok: true })
    })

    it('emits to a channel when a target channel is provided', () => {
        const { WebSocketEmitter } = loadGateway()
        const { server, to, toEmit } = createServer()

        WebSocketEmitter.bind(server)
        WebSocketEmitter.emit('event', { ok: true }, { channel: 'room' })

        expect(to).toHaveBeenCalledWith('room')
        expect(toEmit).toHaveBeenCalledWith('event', { ok: true })
    })

    it('emits through a namespace when provided', () => {
        const { WebSocketEmitter } = loadGateway()
        const { server, of, namespaceEmit } = createServer()

        WebSocketEmitter.bind(server)
        WebSocketEmitter.emit('event', { ok: true }, { namespace: '/events' })

        expect(of).toHaveBeenCalledWith('/events')
        expect(namespaceEmit).toHaveBeenCalledWith('event', { ok: true })
    })

    it('emits through a namespace channel when both are provided', () => {
        const { WebSocketEmitter } = loadGateway()
        const { server, of, namespaceTo, namespaceToEmit } = createServer()

        WebSocketEmitter.bind(server)
        WebSocketEmitter.emit('event', { ok: true }, { namespace: '/events', channel: 'room' })

        expect(of).toHaveBeenCalledWith('/events')
        expect(namespaceTo).toHaveBeenCalledWith('room')
        expect(namespaceToEmit).toHaveBeenCalledWith('event', { ok: true })
    })
})

describe('BaseWebSocketGateway', () => {
    it('binds the server on init', () => {
        const { BaseWebSocketGateway, WebSocketEmitter } = loadGateway()
        const { server } = createServer()

        const gateway = new BaseWebSocketGateway()
        gateway.afterInit(server)

        expect(WebSocketEmitter.hasServer()).toBe(true)
    })
})
