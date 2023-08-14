import React, {FC} from 'react';
import withStyles, {WithStylesProps} from "react-jss";
import { InputNumber } from 'antd';


// JSS. Стили компонента
const styles = {
    textcol:{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        backgroundColor: "red",
        "& span":{
            lineHeight: 2
        }
    }
}

interface InputCurrencyProps extends WithStylesProps<typeof styles> {
    // props component
}

const InputCurrencyImpl = React.forwardRef<any, InputCurrencyProps>((props, ref)=>{
    const {...otherProps} = props;

    return <InputNumber
                precision={2}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                parser={(value) => value!.replace(/\$\s?|(\s*)/g, '')}
                {...otherProps}
    />
    
})

export const InputCurrency = withStyles(styles)(InputCurrencyImpl)
