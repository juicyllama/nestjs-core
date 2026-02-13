import { Injectable } from '@nestjs/common'
import { OnGatewayInit, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Server } from 'socket.io'

export interface WebSocketTarget {
    channel?: string
    namespace?: string
}

@WebSocketGateway()
@Injectable()
export class BaseWebSocketGateway implements OnGatewayInit {
    @WebSocketServer()
    server!: Server

    afterInit(server: Server) {
        WebSocketEmitter.bind(server)
    }
}

let serverInstance: Server | undefined

export const WebSocketEmitter = {
    bind(server: Server) {
        serverInstance = server
    },
    hasServer(): boolean {
        return !!serverInstance
    },
    emit(event: string, payload: unknown, target: WebSocketTarget = {}): void {
        if (!serverInstance) {
            return
        }

        const emitter = target.namespace ? serverInstance.of(target.namespace) : serverInstance

        if (target.channel) {
            emitter.to(target.channel).emit(event, payload)
            return
        }

        emitter.emit(event, payload)
    },
}
