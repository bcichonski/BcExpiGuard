import types from './types'
import { DATE_FORMAT } from '../../constants/constants'
import { format, addDays } from 'date-fns'
import defaultCategory from '../categories/reducers'
import { itemParsley, itemBread, itemDrivingLicense, itemPasta } from '../item-names/reducers'

function createData(id, nameItem, quantity, unit, date, state = types.ITEM_ACTIVE) {
    return {
        id,
        categoryID: defaultCategory.id,
        nameID: nameItem.id,
        quantity,
        unit,
        date,
        state
    };
}

function daysFromNow(days) {
    return format(addDays(new Date(), days), DATE_FORMAT)
}

const defaultItems = [
    createData('abac', itemParsley, '2.5', 'kg', daysFromNow(-1)),
    createData('abbc', itemBread, '3', 'l', daysFromNow(0)),
    createData('adbc', itemPasta, '3', 'bags', daysFromNow(3)),
    createData('ae3bc', itemBread, '', '', daysFromNow(14)),
    createData('a2bc', itemDrivingLicense, '', '', daysFromNow(300)),
];

function changeItem(item, value) {
    const newItem = Object.assign({}, item);

    if(value === 'cancel' || value === false) return item

    if(item.quantity === '') {
        newItem.state = types.ITEM_DONE
        return newItem
    }

    if (item.quantity !== '' && !isNaN(item.quantity)) {
        if (!isNaN(value)) {
            const oldValue = parseInt(item.quantity)
            const newValue = parseInt(value)

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
            return newItem
        }
    }

    newItem.previousQuantity = item.quantity
    newItem.quantity = value
    newItem.state = (value === '' ? types.ITEM_DONE : types.ITEM_CHANGED)
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

    return newItem
}

const itemsReducer = (state = defaultItems, action) => {
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
        default:
            return state
    }
}

export default itemsReducer;