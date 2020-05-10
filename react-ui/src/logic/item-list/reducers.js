import types from './types'
import { DATE_FORMAT } from '../../constants/constants'
import { format, addDays } from 'date-fns'

function createData(id, name, quantity, date) {
    return { id, name, quantity, date };
}

function daysFromNow(days) {
    return format(addDays(new Date(), days), DATE_FORMAT)
}

const defaultItems = [
    createData('abac', 'Parsley', '2', daysFromNow(-1)),
    createData('abbc', 'Bread', '3', daysFromNow(0)),
    createData('adbc', 'Pasta', '', daysFromNow(3)),
    createData('ae3bc', 'Bread', '', daysFromNow(14)),
    createData('a2bc', 'Driving license', '', daysFromNow(300)),
];

const itemsReducer = (state = defaultItems, action) => {
    switch (action.type) {
        case types.ITEM_ADD:
            return [
                ...state,
                {
                    id: action.data.id,
                    name: action.data.name,
                    date: action.data.data,
                    quantity: action.data.quantity
                }
            ]
        default:
            return state
    }
}

export default itemsReducer;