import PouchDB from 'pouchdb'
import memoryAdapter from 'pouchdb-adapter-memory'
import pouchdbUpsert from 'pouchdb-upsert'
import items from '../../persistence/items'
import itemNames from '../../persistence/itemNames'

// Shared mutable provider stub. Each test sets local DBs (and optionally a remote) on it.
const provider = vi.hoisted(() => ({ userId: 'user-1', logged: true, local: {}, remote: undefined }))

vi.mock('../../persistence', () => ({ default: provider }))

PouchDB.plugin(memoryAdapter)
PouchDB.plugin(pouchdbUpsert)

describe('persistence local-only writes', () => {
    let counter = 0
    let dbs = []

    const openDb = (name) => {
        const db = new PouchDB(`${name}-${Date.now()}-${counter++}`, { adapter: 'memory' })
        dbs.push(db)
        return db
    }

    beforeEach(() => {
        provider.local = {
            items: openDb('items'),
            item_names: openDb('item_names'),
        }
        provider.remote = undefined
    })

    afterEach(async () => {
        await Promise.all(dbs.map((db) => db.destroy()))
        dbs = []
    })

    const sampleItem = (overrides = {}) => ({
        id: 'item-1',
        name: 'Milk',
        date: '2026-01-01',
        quantity: 2,
        unit: 'l',
        state: 'ok',
        nameID: 'name-1',
        ...overrides,
    })

    describe('items', () => {
        it('add stores the item locally when no remote is configured', async () => {
            await items.add(sampleItem())
            const doc = await provider.local.items.get('item-1')
            expect(doc.name).toBe('Milk')
            expect(doc.userId).toBe('user-1')
            expect(doc.groupId).toBe('user-1')
        })

        it('add does not overwrite an existing item', async () => {
            await items.add(sampleItem())
            await items.add(sampleItem({ name: 'Changed' }))
            const doc = await provider.local.items.get('item-1')
            expect(doc.name).toBe('Milk')
        })

        it('changeState updates state and changed_timestamp locally', async () => {
            await items.add(sampleItem())
            await items.changeState('item-1', 'consumed')
            const doc = await provider.local.items.get('item-1')
            expect(doc.state).toBe('consumed')
            expect(doc.changed_timestamp).toBeDefined()
        })

        it('changeQuantity records previous_quantity when the quantity differs', async () => {
            await items.add(sampleItem())
            await items.changeQuantity('item-1', 5)
            const doc = await provider.local.items.get('item-1')
            expect(doc.quantity).toBe(5)
            expect(doc.previous_quantity).toBe(2)
            expect(doc.changed_timestamp).toBeDefined()
        })

        it('changeQuantity leaves the doc untouched when the quantity is the same', async () => {
            await items.add(sampleItem({ changed_timestamp: 'fixed' }))
            await items.changeQuantity('item-1', 2)
            const doc = await provider.local.items.get('item-1')
            expect(doc.previous_quantity).toBeUndefined()
            expect(doc.changed_timestamp).toBe('fixed')
        })

        it('update applies only the changed fields and sets changed_timestamp', async () => {
            await items.add(sampleItem({ changed_timestamp: 'fixed' }))
            await items.update('item-1', sampleItem({ name: 'Oat milk', quantity: 3, previous_quantity: 2, changed_timestamp: '2026-02-02' }))
            const doc = await provider.local.items.get('item-1')
            expect(doc.name).toBe('Oat milk')
            expect(doc.quantity).toBe(3)
            expect(doc.previous_quantity).toBe(2)
            expect(doc.unit).toBe('l')
            expect(doc.changed_timestamp).toBe('2026-02-02')
        })

        it('update without differences keeps the document and its timestamp', async () => {
            await items.add(sampleItem({ changed_timestamp: 'fixed' }))
            await items.update('item-1', sampleItem({ changed_timestamp: '2026-02-02' }))
            const doc = await provider.local.items.get('item-1')
            expect(doc.changed_timestamp).toBe('fixed')
        })

        it('never touches a remote object, even when one is present', async () => {
            const remoteTable = {
                putIfNotExists: vi.fn(),
                upsert: vi.fn(),
            }
            provider.remote = { items: { remote_table: remoteTable } }

            await items.add(sampleItem())
            await items.changeState('item-1', 'consumed')
            await items.changeQuantity('item-1', 4)
            await items.update('item-1', sampleItem({ name: 'Eggs' }))

            expect(remoteTable.putIfNotExists).not.toHaveBeenCalled()
            expect(remoteTable.upsert).not.toHaveBeenCalled()
        })
    })

    describe('itemNames', () => {
        it('add stores the name locally when no remote is configured', async () => {
            await itemNames.add({ id: 'name-1', name: 'Milk' })
            const doc = await provider.local.item_names.get('name-1')
            expect(doc.name).toBe('Milk')
            expect(doc.userId).toBe('user-1')
        })

        it('add revives a deleted name', async () => {
            await provider.local.item_names.put({ _id: 'name-1', name: 'Milk', userId: 'user-1' })
            const existing = await provider.local.item_names.get('name-1')
            await provider.local.item_names.remove(existing)

            await itemNames.add({ id: 'name-1', name: 'Milk' })

            const doc = await provider.local.item_names.get('name-1')
            expect(doc._deleted).toBeUndefined()
            expect(doc.name).toBe('Milk')
        })

        it('never touches a remote object, even when one is present', async () => {
            const remoteTable = { upsert: vi.fn() }
            provider.remote = { item_names: { remote_table: remoteTable } }

            await itemNames.add({ id: 'name-1', name: 'Milk' })

            expect(remoteTable.upsert).not.toHaveBeenCalled()
        })
    })
})
