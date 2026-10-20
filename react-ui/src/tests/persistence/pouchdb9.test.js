import PouchDB from 'pouchdb'
import memoryAdapter from 'pouchdb-adapter-memory'
import pouchdbUpsert from 'pouchdb-upsert'

PouchDB.plugin(memoryAdapter)
PouchDB.plugin(pouchdbUpsert)

describe('PouchDB 9 with pouchdb-upsert', () => {
    let db
    let counter = 0

    beforeEach(() => {
        db = new PouchDB(`smoke-${Date.now()}-${counter++}`, { adapter: 'memory' })
    })

    afterEach(async () => {
        await db.destroy()
    })

    it('putIfNotExists creates a missing doc and leaves an existing one untouched', async () => {
        await db.putIfNotExists({ _id: 'a', value: 1 })
        await db.putIfNotExists({ _id: 'a', value: 2 })
        const doc = await db.get('a')
        expect(doc.value).toBe(1)
    })

    it('upsert creates and then updates a doc through the diff function', async () => {
        await db.upsert('b', () => ({ value: 1 }))
        await db.upsert('b', (doc) => ({ ...doc, value: doc.value + 1 }))
        const doc = await db.get('b')
        expect(doc.value).toBe(2)
    })
})
