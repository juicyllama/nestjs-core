import { BulkUploadResponse, ImportMode, Query } from '@juicyllama/typeorm'
import { Injectable } from '@nestjs/common'
import { DeepPartial, FindManyOptions, FindOneOptions, ObjectLiteral, Repository } from 'typeorm'
import { WebSocketAction, WebSocketOptions } from '../types'
import { WebSocketEmitter } from './websocket.gateway'

/**
 * Base service for all services
 *
 * * Calls the repository function
 */

@Injectable()
export class BaseService<T extends ObjectLiteral> {
    constructor(
        readonly query: Query<T>,
        readonly repository: Repository<T>,
        readonly options?: {
            ws?: WebSocketOptions
        },
    ) {}

    private emit(action: WebSocketAction, data: unknown): void {
        const ws = this.options?.ws
        if (!ws?.enabled) {
            return
        }

        const event = ws.events?.[action] ?? action
        const channel = ws.channel
        const namespace = ws.namespace
        const service = ws.service
        const payload = ws.buildPayload ? ws.buildPayload({ action, data, channel, namespace, service }) : data

        try {
            if (!WebSocketEmitter.hasServer()) {
                if (ws.throwOnError) {
                    throw new Error('WebSocket server not initialized. Register BaseWebSocketGateway in a module.')
                }
                return
            }
            WebSocketEmitter.emit(event, payload, { channel, namespace })
        } catch (error) {
            if (ws.throwOnError) {
                throw error
            }
        }
    }

    /**
     * Creates a new record in the database
     * @param data
     */

    async create(data: DeepPartial<T>, relations: string[] = []): Promise<T> {
        const result = await this.query.create(this.repository, data, relations)
        this.emit('create', result)
        return result
    }

    /**
     * Creates many new records in the database
     * @param qty - number of records to create
     * @param data - the data to create
     */

    async createMany(qty: number, data: DeepPartial<T>): Promise<T[]> {
        const results: T[] = []

        for (let i = 0; i < qty; i++) {
            const result = await this.query.create(this.repository, data)
            results.push(result)
        }

        this.emit('createMany', results)
        return results
    }

    /*
     * Bulk insert, upsert or delete records into the database
     * @param data
     * @param import_mode
     * @param dedup_field
     */

    async bulk(data: DeepPartial<T>[], import_mode: ImportMode, dedup_field?: string): Promise<BulkUploadResponse> {
        const result = await this.query.bulk(this.repository, data, import_mode, dedup_field)
        this.emit('bulk', result)
        return result
    }

    /**
     * Finds all records by the options
     * @param options
     */

    async findAll(options?: FindManyOptions<T>): Promise<T[]> {
        return await this.query.findAll(this.repository, options)
    }

    /**
     * Finds a single record by the options
     * @param options
     */

    async findOne(options?: FindOneOptions<T>): Promise<T | null> {
        return await this.query.findOne(this.repository, options)
    }

    /**
     * Finds the record by the id
     * @param id
     * @param relations
     */

    async findById(id: number | string, relations?: string[]): Promise<T | null> {
        if (!id) {
            throw new Error('ID is required')
        }
        return await this.query.findOneById(this.repository, id, relations)
    }

    /**
     * Counts the number of records in the database
     * @param options
     */

    async count(options?: FindManyOptions<T>): Promise<number> {
        return await this.query.count(this.repository, options)
    }

    /**
     * Sums the metric by the options
     * @param metric
     * @param options
     */

    async sum(metric: string, options?: FindManyOptions<T>): Promise<number> {
        return await this.query.sum(this.repository, metric, options)
    }

    /**
     * Averages the metric by the options
     * @param metric
     * @param options
     */

    async avg(metric: string, options?: FindManyOptions<T>): Promise<number> {
        return await this.query.avg(this.repository, metric, options)
    }

    /**
     * Updates the record in the database
     * @param data
     * @param relations - any relations to include in the response
     */

    async update(data: DeepPartial<T>, relations: string[] = []): Promise<T> {
        const result = await this.query.update(this.repository, data, relations)
        this.emit('update', result)
        return result
    }

    /**
     * Soft delete, can be restored if needed
     * @param record
     */

    async remove(record: T): Promise<T> {
        const result = await this.query.remove(this.repository, record)
        this.emit('remove', result)
        return result
    }

    /**
     * Deletes the record from the database can cannot be recovered
     * @param record
     */

    async purge(record: T): Promise<void> {
        await this.query.purge(this.repository, record)
        this.emit('purge', record)
    }

    async raw(sql: string) {
        return await this.query.raw(this.repository, sql)
    }
}
