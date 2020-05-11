import { v5 as uuidv5 } from 'uuid'

export const NAMESPACES = {
    ItemName: 'fb52d0d0-929b-11ea-bb37-0242ac130002',
    CategoryName: '2079d295-d71c-491a-a6ee-32f79c3733ec'
}

export function createUUID(namespace, value) {
    return uuidv5(value, namespace)
}