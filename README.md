<div align="center">
  <a href="https://juicyllama.com/" target="_blank">
    <img src="https://juicyllama.com/assets/images/icon.png" width="100" alt="JuicyLlama Logo" />
  </a>

Visit the [JuicyLlama](https://juicyllama.com) to learn more.
</div>

## BaseService

`BaseService` wraps common TypeORM operations and (optionally) emits websocket events after database actions.

### Basic usage

```ts
const service = new BaseService(query, repository)
```

### Usage The Nest Way

```ts
@Injectable()
export class BillingService extends BaseService<T> {
    constructor(
        readonly query: Query<T>,
        @InjectRepository(E) readonly repository: Repository<T>,
    ) {
        super(query, repository)
    }
}

```

### BaseService API

Each method delegates to the underlying `Query` helper and `Repository` and returns the corresponding result.

- `create(data, relations?)`: Create a single record (optionally with relations) and return it.
- `createMany(qty, data)`: Create `qty` records using the provided data and return the array.
- `bulk(data, import_mode, dedup_field?)`: Bulk insert, upsert, or delete records based on the import mode.
- `findAll(options?)`: Find all records matching the TypeORM find options.
- `findOne(options?)`: Find a single record matching the TypeORM find options.
- `findById(id, relations?)`: Find a record by id (optionally with relations). Throws if `id` is missing.
- `count(options?)`: Count records matching the TypeORM find options.
- `sum(metric, options?)`: Sum a numeric metric for records matching the options.
- `avg(metric, options?)`: Average a numeric metric for records matching the options.
- `update(data, relations?)`: Update a record and return it (optionally with relations).
- `remove(record)`: Soft delete a record (recoverable).
- `purge(record)`: Hard delete a record (not recoverable).
- `raw(sql)`: Execute a raw SQL query via the repository.


### Websocket support

This package uses a NestJS gateway internally. Register `BaseWebSocketGateway` once in a module to initialize the websocket server.

```ts
import {BaseWebSocketGateway, BillingService} from '@juicyllama/nestjs-core'

@Module({
    providers: [BaseWebSocketGateway, BillingService],
})
export class BillingModule {}
```

Pass `options.ws` in the constructor to emit events on database actions.

```ts
const service = new BaseService(query, repository, {
    ws: {
        channel: 'users',
        service: 'users',
        namespace: '/events',
        events: {
            create: 'users.create',
            update: 'users.update',
        },
    },
})
```

**Supported actions**
- `create`
- `createMany`
- `bulk`
- `update`
- `remove`
- `purge`

**WebSocketOptions**
- `enabled?: boolean` - disable all websocket emits if `false`
- `channel?: string` - default channel for emits
- `namespace?: string` - optional namespace for emits
- `service?: string` - service identifier for payload context
- `events?: Partial<Record<WebSocketAction, string>>` - override event names
- `buildPayload?: (context) => unknown` - shape payload before emit
- `throwOnError?: boolean` - throw if emit fails or the gateway isn't registered
