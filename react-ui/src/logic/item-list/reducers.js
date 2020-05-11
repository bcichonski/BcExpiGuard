import types from './types'
import { DATE_FORMAT } from '../../constants/constants'
import { format, addDays } from 'date-fns'
import defaultCategory from '../categories/reducers'
import { itemParsley, itemBread, itemDrivingLicense, itemPasta } from '../item-names/reducers'

function createData(id, nameItem, quantity, date) {
    return {
        id,
        categoryID: defaultCategory.id,
        nameID: nameItem.id,
        quantity, 
        date
    };
}

function daysFromNow(days) {
    return format(addDays(new Date(), days), DATE_FORMAT)
}

const defaultItems = [
    createData('abac', itemParsley, '2', daysFromNow(-1)),
    createData('abbc', itemBread, '3', daysFromNow(0)),
    createData('adbc', itemPasta, '', daysFromNow(3)),
    createData('ae3bc', itemBread, '', daysFromNow(14)),
    createData('a2bc', itemDrivingLicense, '', daysFromNow(300)),
];

const itemsReducer = (state = defaultItems, action) => {
    switch (action.type) {
        case types.ITEM_ADD:
            return [
                ...state,
                {
                    id: action.data.id,
                    name: action.data.name,
                    date: action.data.date,
                    quantity: action.data.quantity
                }
            ]
        default:
            return state
    }
}

export default itemsReducer;