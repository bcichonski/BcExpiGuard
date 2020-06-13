import { v5 as uuidv5, v4 as uuidv4 } from 'uuid'

export const NAMESPACES = {
    ItemName: 'fb52d0d0-929b-11ea-bb37-0242ac130002',
    CategoryName: '2079d295-d71c-491a-a6ee-32f79c3733ec',
    UserId: '5a4b4398-a842-41a0-b43e-78feb05d213c'
}

export function createUUID(namespace, value) {
    return uuidv5(value, namespace)
}

export function newUUID() {
    return uuidv4()
}

export function refresh(item, refreshItem) {
    let newItem = Object.assign({}, item)

    if (refreshItem) {
        for (const key in item) {
            if (item.hasOwnProperty(key)) {
                const element = item[key];

                const refreshedElement = refreshItem[key];

                if (typeof refreshedElement !== 'undefined' && element !== refreshedElement) {
                    newItem[key] = refreshedElement
                }
            }
        }
    }

    return newItem
}

export function refreshState(state = [], emptyItem = {}, payload = {}) {
    const newState = state.map(element => {
        const newItemIndex = payload.findIndex(it => {
            if(typeof it === 'undefined'){
                return false
            }
            if(!it.id) {
                console.log(`payload element has no id`)
            }
            if(!element.id) {
                console.log(`state element has no id`)
            }
            return it.id === element.id
        })
        let result = undefined
        if (newItemIndex > -1) {
            result = refresh(element, payload[newItemIndex])
            delete payload[newItemIndex]
        }
        else {
            result = refresh(emptyItem, element)
        }
        return result
    });
    payload.forEach(element => {
        if (element) {
            newState.push(refresh(emptyItem, element))
        }
    });
    return newState
}