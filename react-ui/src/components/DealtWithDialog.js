import React from 'react';
import ChoiceDialog from './ChoiceDialog'
import ConfirmDialog from './ConfirmDialog'
import PropTypes from 'prop-types';

function generateChoices(item) {
    let quantity = parseInt(item.quantity)
    let choices = []

    let s = ''
    for (let i = 1; i <= Math.min(3, quantity); i++) {
        choices.push({
            id: i.toString(),
            name: `${i} ${item.unit}${s}`
        })
        s = 's'
    }

    if (quantity > 3) {
        choices.push({
            id: 'more',
            name: 'Other...'
        })
    }

    choices.push({
        id: 'all',
        name: `All ${item.quantity}`
    })

    choices.push({
        id: 'cancel',
        name: 'Cancel'
    })

    return choices
}

function DealtWithDialog(props) {

    const handleClose = (value) => {
        props.setResult(props.item, value);
    };

    if (props.item) {
        if (!props.item.quantity || typeof props.item.quantity !== 'string' || isNaN(props.item.quantity)) {
            return (
                <ConfirmDialog title={props.item.name} descript="Please confirm it's done" open={props.open} onClose={handleClose} />
            )
        }

        if (!isNaN(props.item.quantity)) {
            return (
                <ChoiceDialog open={props.open} onClose={handleClose} title="How many?" choices={generateChoices(props.item)} />
            )
        }
    }

    return null;
}

DealtWithDialog.propTypes = {
    item: PropTypes.object,
    open: PropTypes.bool,
    setResult: PropTypes.func
}

export default DealtWithDialog;