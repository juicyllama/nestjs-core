import type { ImportMode, Query } from '@juicyllama/typeorm'
import { Repository } from 'typeorm'
import { WebSocketOptions } from '../types'
import { BaseService } from './service'
import { WebSocketEmitter } from './websocket.gateway'

type TestEntity = {
    id: number
    name?: string
}

type ServiceSetup = {
    service: BaseService<TestEntity>
    query: Query<TestEntity>
    repository: Repository<TestEntity>
}

const createQuery = (): Query<TestEntity> =>
    ({
        create: jest.fn(),
        bulk: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
        findOneById: jest.fn(),
        count: jest.fn(),
        sum: jest.fn(),
        avg: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
        purge: jest.fn(),
        raw: jest.fn(),
    }) as unknown as Query<TestEntity>

const setupService = (options?: { ws?: WebSocketOptions }): ServiceSetup => {
    const query = createQuery()
    const repository = {} as Repository<TestEntity>
    return {
        service: new BaseService<TestEntity>(query, repository, options),
        query,
        repository,
    }
}

describe('BaseService', () => {
    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('creates a record and emits when websocket is enabled', async () => {
        const buildPayload = jest.fn(ctx => ({ action: ctx.action, data: ctx.data, service: ctx.service }))
        const { service, query, repository } = setupService({
            ws: {
                enabled: true,
                service: 'tests',
                events: {
                    create: 'tests.create',
                },
                buildPayload,
            },
        })

        const emitSpy = jest.spyOn(WebSocketEmitter, 'emit').mockImplementation(() => {})
        jest.spyOn(WebSocketEmitter, 'hasServer').mockReturnValue(true)

        const created = { id: 1, name: 'alpha' }
        ;(query.create as jest.Mock).mockResolvedValue(created)

        const result = await service.create({ name: 'alpha' })

        expect(query.create).toHaveBeenCalledWith(repository, { name: 'alpha' }, [])
        expect(result).toEqual(created)
        expect(buildPayload).toHaveBeenCalledWith({
            action: 'create',
            data: created,
            channel: undefined,
            namespace: undefined,
            service: 'tests',
        })
        expect(emitSpy).toHaveBeenCalledWith(
            'tests.create',
            { action: 'create', data: created, service: 'tests' },
            { channel: undefined, namespace: undefined },
        )
    })

    it('creates many records and emits once with all results', async () => {
        const { service, query } = setupService({
            ws: {
                enabled: true,
            },
        })
        const emitSpy = jest.spyOn(WebSocketEmitter, 'emit').mockImplementation(() => {})
        jest.spyOn(WebSocketEmitter, 'hasServer').mockReturnValue(true)
        ;(query.create as jest.Mock)
            .mockResolvedValueOnce({ id: 1, name: 'first' })
            .mockResolvedValueOnce({ id: 2, name: 'second' })

        const results = await service.createMany(2, { name: 'seed' })

        expect(query.create).toHaveBeenCalledTimes(2)
        expect(results).toEqual([
            { id: 1, name: 'first' },
            { id: 2, name: 'second' },
        ])
        expect(emitSpy).toHaveBeenCalledWith('createMany', results, { channel: undefined, namespace: undefined })
    })

    it('delegates bulk and emits result', async () => {
        const { service, query } = setupService({
            ws: {
                enabled: true,
            },
        })
        const emitSpy = jest.spyOn(WebSocketEmitter, 'emit').mockImplementation(() => {})
        jest.spyOn(WebSocketEmitter, 'hasServer').mockReturnValue(true)

        const response = { created: 2, updated: 0, deleted: 0 } as unknown
        ;(query.bulk as jest.Mock).mockResolvedValue(response)

        const result = await service.bulk([{ name: 'a' }], 'insert' as ImportMode)

        expect(result).toBe(response)
        expect(emitSpy).toHaveBeenCalledWith('bulk', response, { channel: undefined, namespace: undefined })
    })

    it('delegates query read operations', async () => {
        const { service, query, repository } = setupService()

        const records = [{ id: 1 }]
        const record = { id: 2 }
        ;(query.findAll as jest.Mock).mockResolvedValue(records)
        ;(query.findOne as jest.Mock).mockResolvedValue(record)
        ;(query.findOneById as jest.Mock).mockResolvedValue(record)
        ;(query.count as jest.Mock).mockResolvedValue(10)
        ;(query.sum as jest.Mock).mockResolvedValue(42)
        ;(query.avg as jest.Mock).mockResolvedValue(3.5)
        ;(query.raw as jest.Mock).mockResolvedValue([{ ok: true }])

        expect(await service.findAll({})).toBe(records)
        expect(query.findAll).toHaveBeenCalledWith(repository, {})

        expect(await service.findOne({})).toBe(record)
        expect(query.findOne).toHaveBeenCalledWith(repository, {})

        expect(await service.findById(2, ['rel'])).toBe(record)
        expect(query.findOneById).toHaveBeenCalledWith(repository, 2, ['rel'])

        expect(await service.count({})).toBe(10)
        expect(query.count).toHaveBeenCalledWith(repository, {})

        expect(await service.sum('metric', {})).toBe(42)
        expect(query.sum).toHaveBeenCalledWith(repository, 'metric', {})

        expect(await service.avg('metric', {})).toBe(3.5)
        expect(query.avg).toHaveBeenCalledWith(repository, 'metric', {})

        expect(await service.raw('select 1')).toEqual([{ ok: true }])
        expect(query.raw).toHaveBeenCalledWith(repository, 'select 1')
    })

    it('delegates write operations without websocket options', async () => {
        const { service, query, repository } = setupService()

        const emitSpy = jest.spyOn(WebSocketEmitter, 'emit')
        const hasServerSpy = jest.spyOn(WebSocketEmitter, 'hasServer')

        const updated = { id: 3, name: 'update' }
        const removed = { id: 4, name: 'remove' }
        ;(query.update as jest.Mock).mockResolvedValue(updated)
        ;(query.remove as jest.Mock).mockResolvedValue(removed)
        ;(query.purge as jest.Mock).mockResolvedValue(undefined)

        expect(await service.update({ id: 3 })).toBe(updated)
        expect(query.update).toHaveBeenCalledWith(repository, { id: 3 }, [])

        expect(await service.remove(removed)).toBe(removed)
        expect(query.remove).toHaveBeenCalledWith(repository, removed)

        await service.purge(removed)
        expect(query.purge).toHaveBeenCalledWith(repository, removed)

        expect(hasServerSpy).not.toHaveBeenCalled()
        expect(emitSpy).not.toHaveBeenCalled()
    })

    it('throws when findById is called without an id', async () => {
        const { service, query } = setupService()

        await expect(service.findById(undefined as unknown as number)).rejects.toThrow('ID is required')
        expect(query.findOneById).not.toHaveBeenCalled()
    })

    it('does not throw when websocket server is missing and throwOnError is false', async () => {
        const { service, query } = setupService({
            ws: {
                enabled: true,
                throwOnError: false,
            },
        })
        jest.spyOn(WebSocketEmitter, 'hasServer').mockReturnValue(false)
        ;(query.create as jest.Mock).mockResolvedValue({ id: 1 })

        await expect(service.create({})).resolves.toEqual({ id: 1 })
    })

    it('throws when websocket server is missing and throwOnError is true', async () => {
        const { service, query } = setupService({
            ws: {
                enabled: true,
                throwOnError: true,
            },
        })
        jest.spyOn(WebSocketEmitter, 'hasServer').mockReturnValue(false)
        ;(query.create as jest.Mock).mockResolvedValue({ id: 1 })

        await expect(service.create({})).rejects.toThrow(
            'WebSocket server not initialized. Register BaseWebSocketGateway in a module.',
        )
    })

    it('swallows websocket emit errors when throwOnError is false', async () => {
        const { service, query } = setupService({
            ws: {
                enabled: true,
                throwOnError: false,
            },
        })
        jest.spyOn(WebSocketEmitter, 'hasServer').mockReturnValue(true)
        jest.spyOn(WebSocketEmitter, 'emit').mockImplementation(() => {
            throw new Error('emit failed')
        })
        ;(query.create as jest.Mock).mockResolvedValue({ id: 1 })

        await expect(service.create({})).resolves.toEqual({ id: 1 })
    })
})
