import types from './types'
import { DATE_FORMAT } from '../../constants/constants'
import { format, addDays } from 'date-fns'
import defaultCategory from '../categories/reducers'
import { itemParsley, itemBread, itemDrivingLicense, itemPasta } from '../item-names/reducers'

function createData(id, nameItem, quantity, date, state = types.ITEM_ACTIVE) {
    return {
        id,
        categoryID: defaultCategory.id,
        nameID: nameItem.id,
        quantity,
        date,
        state
    };
}

function daysFromNow(days) {
    return format(addDays(new Date(), days), DATE_FORMAT)
}

const defaultItems = [
    createData('abac', itemParsley, '2', daysFromNow(-1)),
    createData('abbc', itemBread, '3', daysFromNow(0)),
    createData('adbc', itemPasta, '3 bags', daysFromNow(3)),
    createData('ae3bc', itemBread, '', daysFromNow(14)),
    createData('a2bc', itemDrivingLicense, '', daysFromNow(300)),
];

function changeItem(item, value) {
    const newItem = Object.assign({}, item);

    if(value === 'cancel' || value === false || value === item.quantity) return item

    if (!isNaN(item.quantity)) {
        if (!isNaN(value)) {
            const oldValue = parseInt(item.quantity)
            const newValue = parseInt(value)

            if (oldValue < newValue) {
                throw Error("New value cannot be greater than old value")
            }

            if (newValue <= 0) {
                newItem.previousQuantity = item.quantity
                newItem.quantity = '0'
                newItem.state = types.ITEM_DONE
                return newItem
            }
        }
    }
    newItem.previousQuantity = item.quantity
    newItem.quantity = value
    newItem.state = (value === '' ? types.ITEM_DONE : types.ITEM_CHANGED)
    return newItem
}

const itemsReducer = (state = defaultItems, action) => {
    switch (action.type) {
        case types.ITEM_ADD:
            return [
                ...state,
                {
                    id: action.data.id,
                    name: action.data.name,
                    date: action.data.date,
                    quantity: action.data.quantity,
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
        default:
            return state
    }
}

export default itemsReducer;