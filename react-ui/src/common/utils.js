import { v5 as uuidv5, v4 as uuidv4 } from 'uuid'
import { formatISO, compareAsc } from 'date-fns'
import { parseISO, differenceInMinutes } from 'date-fns'

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

export function refresh(item, refreshItem, latest = false) {
    let newItem = Object.assign({}, item)

    if (refreshItem) {
        if(latest) {
            if(refreshItem.changed_timestamp) {
                if(item.changed_timestamp) {
                    const refreshItemChanged = parseISO(refreshItem.changed_timestamp)
                    const itemChanged = parseISO(item.changed_timestamp)

                    if(compareAsc(itemChanged, refreshItemChanged) !== -1) {
                        return newItem
                    }
                }
            } else {
                return newItem
            }
        }

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

export function refreshState(state = [], emptyItem = {}, payloadArg = {}, latest = false) {
    const payload = [...payloadArg]
    const newState = state.map(element => {
        const newItemIndex = payload.findIndex(it => {
            if (typeof it === 'undefined') {
                return false
            }
            if (!it.id) {
                console.log(`payload element has no id`)
            }
            if (!element.id) {
                console.log(`state element has no id`)
            }
            return it.id === element.id
        })
        let result = undefined
        if (newItemIndex > -1) {
            result = refresh(element, payload[newItemIndex], latest)
            delete payload[newItemIndex]
        }
        else {
            result = refresh(emptyItem, element)
        }
        return result
    });
    payload.forEach(element => {
        if (element) {
            newState.push(refresh(emptyItem, element, latest))
        }
    });
    return newState
}

export function nowISO() {
    return formatISO(new Date())
}

export function changedLastQuarter(item, today) {
    const diff = differenceInMinutes(parseISO(item.changed_timestamp), today)
    return diff >= 0 && diff < 15
}