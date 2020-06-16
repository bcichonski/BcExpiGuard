import React, { useState } from 'react';
import ChoiceDialog from './ChoiceDialog'
import ConfirmDialog from './ConfirmDialog'
import PropTypes from 'prop-types';
import InputDialog from './InputDialog';

function generateChoices(item) {
    let quantity = parseFloat(item.quantity)
    let choices = []
    let pieces = 4

    if (quantity % 3 === 0) {
        pieces = 3
    }

    let plural = 's'
    if (quantity <= 1) {
        plural = ''
    }

    choices.push({
        id: 'all',
        name: `All ${item.quantity} ${item.unit}${plural}`
    })

    for (let i = 2; i <= pieces; i++) {
        let piece = Math.floor(quantity / i * 100) / 100
        plural = 's'
        if (piece <= 1) {
            plural = ''
        }
        choices.push({
            id: piece.toString(),
            name: `${piece} ${item.unit}${plural}`
        })
    }

    choices.push({
        id: 'more',
        name: 'Other...'
    })

    choices.push({
        id: 'cancel',
        name: 'Cancel'
    })

    return choices
}

function DealtWithDialog(props) {
    const [moreDialog, setMoreDialog] = useState(false)

    const handleClose = (value) => {
        if (moreDialog) {
            setMoreDialog(false)
        }

        if (value === 'more') {
            setMoreDialog(true)
            return
        }

        props.setResult(props.item, value);
    };

    if (props.item) {
        if (moreDialog) {
            return (
                <InputDialog title='Custom amount' 
                descript={`Please enter how many ${props.item.unit}s were used`}
                label='ToDO' open={moreDialog} 
                onClose={handleClose} 
                value={props.item.quantity}
                maxValue={parseFloat(props.item.quantity)}
                />
            )
        }

        if (!props.item.quantity || typeof props.item.quantity !== 'string' || isNaN(props.item.quantity)) {
            return (
                <ConfirmDialog 
                title={props.item.name} 
                descript="Please confirm it's done" 
                open={props.open} 
                onClose={handleClose} />
            )
        }

        if (!isNaN(props.item.quantity)) {
            return (
                <ChoiceDialog 
                open={props.open} 
                onClose={handleClose} 
                title="How many?" 
                choices={generateChoices(props.item)} />
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