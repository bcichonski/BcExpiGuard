import { vi } from 'vitest'
import PouchDB from 'pouchdb'
import memoryAdapter from 'pouchdb-adapter-memory'
import LiveSync from '../../persistence/liveSync'

PouchDB.plugin(memoryAdapter)

// "Two devices" (D9): two local in-memory DBs, each live-synced by its own LiveSync to one shared in-memory
// "remote". The remote carries a stand-in for the server's restrict/restrict filter, so the real pull
// options (filter + query_params) are exercised; the push needs no filter.
const restrictDesignDoc = {
    _id: '_design/restrict',
    filters: {
        restrict: function (doc, req) {
            if (doc._id.indexOf('_design/') === 0) {
                return false
            }
            return req.query.groups.indexOf(doc.groupId) !== -1
        }.toString(),
    },
}

describe('live sync between two devices (PouchDB 9, memory adapter)', () => {
    let counter = 0
    let dbs
    let syncs

    const openDb = (name) => {
        const db = new PouchDB(`${name}-${Date.now()}-${counter++}`, { adapter: 'memory' })
        dbs.push(db)
        return db
    }

    const startDevice = (local, remoteDb) => {
        const hooks = { changeSyncState: vi.fn(), refreshData: vi.fn() }
        const sync = new LiveSync()
        syncs.push(sync)
        sync.start({
            items: {
                local,
                remote: { remote_table: remoteDb, filter_name: 'restrict/restrict', filter_params: { groups: ['g1'] } },
            },
        }, hooks)
        return hooks
    }

    beforeEach(() => {
        dbs = []
        syncs = []
    })

    afterEach(async () => {
        // Live syncs must be cancelled, or vitest never exits.
        for (const sync of syncs) {
            sync.stop()
        }
        for (const db of dbs) {
            await db.destroy()
        }
    })

    it('an item written on device A reaches device B and refreshes B', async () => {
        const remote = openDb('remote-items')
        await remote.put(restrictDesignDoc)
        const deviceA = openDb('items-a')
        const deviceB = openDb('items-b')

        const hooksA = startDevice(deviceA, remote)
        const hooksB = startDevice(deviceB, remote)

        // A doc of another group, written before the visible one: once the visible one has arrived,
        // the filtered pull must have skipped this one.
        await remote.put({ _id: 'other-group', groupId: 'g2', name: 'Not mine' })
        await deviceA.put({ _id: 'item-1', groupId: 'g1', name: 'Milk' })

        await vi.waitFor(() => expect(hooksB.refreshData).toHaveBeenCalledWith('items'), { timeout: 10000, interval: 50 })

        const pulled = await deviceB.get('item-1')
        expect(pulled.name).toBe('Milk')
        await expect(deviceB.get('other-group')).rejects.toMatchObject({ status: 404 })
        await expect(deviceB.get('_design/restrict')).rejects.toMatchObject({ status: 404 })
        await expect(remote.get('item-1')).resolves.toMatchObject({ name: 'Milk' })

        // B reports the pulled change; A only pushed.
        expect(hooksA.changeSyncState).toHaveBeenCalledWith('ok')
        expect(hooksB.changeSyncState).toHaveBeenCalledWith('changed')
    })

    it('an edit on device B flows back to device A', async () => {
        const remote = openDb('remote-items')
        await remote.put(restrictDesignDoc)
        const deviceA = openDb('items-a')
        const deviceB = openDb('items-b')
        const hooksA = startDevice(deviceA, remote)
        const hooksB = startDevice(deviceB, remote)

        await deviceA.put({ _id: 'item-2', groupId: 'g1', quantity: 1 })
        await vi.waitFor(() => expect(hooksB.refreshData).toHaveBeenCalled(), { timeout: 10000, interval: 50 })

        const onB = await deviceB.get('item-2')
        await deviceB.put({ ...onB, quantity: 2 })

        await vi.waitFor(async () => {
            expect((await deviceA.get('item-2')).quantity).toBe(2)
        }, { timeout: 10000, interval: 50 })
        expect(hooksA.refreshData).toHaveBeenCalledWith('items')
    })
})
