import PouchDB from 'pouchdb';
import pouchdbDebug from 'pouchdb-debug'
import pouchdbUpsert from 'pouchdb-upsert'
import DbProvider from './DbProvider'

PouchDB.plugin(pouchdbDebug)
PouchDB.debug.enable('*')
PouchDB.plugin(pouchdbUpsert)

const dbProvider = new DbProvider()

export {default as users} from './users'
export {default as categories} from './categories'
export {default as itemNames} from './itemNames'
export {default as items} from './items'

export default dbProvider;

