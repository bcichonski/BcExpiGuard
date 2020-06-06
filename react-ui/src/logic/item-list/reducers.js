import types from './types'

function changeItem(item, value) {
    const newItem = Object.assign({}, item);

    if(value === 'cancel' || value === false) return item

    if(value === 'all') {
        value = item.quantity
    }

    if(item.quantity === '') {
        newItem.state = types.ITEM_DONE
        newItem.changed_timestamp = new Date()
        return newItem
    }

    if (item.quantity !== '' && !isNaN(item.quantity)) {
        if (!isNaN(value)) {
            const oldValue = parseFloat(item.quantity)
            const newValue = parseFloat(value)

            if (oldValue < newValue) {
                throw Error("New value cannot be greater than old value")
            }

            newItem.previousQuantity = item.quantity     
            newItem.quantity = (newItem.quantity - newValue).toString()

            if (newItem.quantity <= 0) {
                newItem.quantity = '0'
                newItem.state = types.ITEM_DONE
            } else {
                newItem.state = types.ITEM_CHANGED
            }
            newItem.changed_timestamp = new Date()
            return newItem
        }
    }

    newItem.previousQuantity = item.quantity
    newItem.quantity = value
    newItem.state = (value === '' ? types.ITEM_DONE : types.ITEM_CHANGED)
    newItem.changed_timestamp = new Date()
    return newItem
}

function undoItemChanges(item) {
    if(item.state === types.ITEM_ACTIVE) return item;
    const newItem = Object.assign({}, item);

    if(!item.previousQuantity) {
        newItem.state = types.ITEM_ACTIVE
    }

    newItem.quantity = item.previousQuantity
    delete newItem.previousQuantity
    newItem.state = types.ITEM_ACTIVE
    newItem.changed_timestamp = new Date()

    return newItem
}

const itemsReducer = (state = [], action) => {
    switch (action.type) {
        case types.ITEM_ADD:
            return [
                ...state,
                {
                    id: action.data.id,
                    nameID: action.data.nameID,
                    date: action.data.date,
                    quantity: action.data.quantity,
                    unit: action.data.unit,
                    state: types.ITEM_ACTIVE
                }
            ]
        case types.ITEM_CHANGED:
            const item = state.find(i => i.id === action.payload.id)
            const otherItems = state.filter(i => i.id !== action.payload.id)
            const changedItem = changeItem(item, action.payload.value)

            return [
                ...otherItems,
                changedItem
            ]
        case types.ITEM_UNDO:
            const item2 = state.find(i => i.id === action.payload.id)
            const otherItems2 = state.filter(i => i.id !== action.payload.id)
            const changedItem2 = undoItemChanges(item2)

            return [
                ...otherItems2,
                changedItem2
            ]
        case types.ITEM_REMOVED:
            const item3 = state.find(i => i.id === action.payload.id)
            const otherItems3 = state.filter(i => i.id !== action.payload.id)
            const changedItem3 = Object.assign({}, item3)
            changedItem3.state = types.ITEM_REMOVED
            return [
                ...otherItems3,
                changedItem3
            ]
        case types.ITEM_LOAD:
            return action.payload;
        default:
            return state
    }
}

export default itemsReducer;