import * as index from './index'

describe('index exports', () => {
    it('exports BaseService', () => {
        expect(index.BaseService).toBeDefined()
    })

    it('exports websocket gateway utilities', () => {
        expect(index.BaseWebSocketGateway).toBeDefined()
        expect(index.WebSocketEmitter).toBeDefined()
    })
})
