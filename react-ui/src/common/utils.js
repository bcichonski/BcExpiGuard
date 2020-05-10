import { v5 as uuidv5 } from 'uuid'

export const NAMESPACES = {
    ItemName: 'fb52d0d0-929b-11ea-bb37-0242ac130002'
}

export function createUUID(namespace, value) {
    return uuidv5(value, namespace)
}