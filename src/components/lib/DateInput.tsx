import React from 'react';
import { DatePicker } from 'antd';
import { DEFAULT_DATE_FORMAT } from "./Const"
import moment from 'moment';

const { RangePicker } = DatePicker;


interface DateInputProps {
    format?: string,
    showTime?: boolean,
    allowClear?: boolean,
    ref?: any,
    open?: boolean,
    onOk?: (value: any) => void,
    onBlur?: (value: any) => void,
    disabled?: boolean,
    key?: string,
    locale?:any
}
export const DateInput = React.forwardRef<any, DateInputProps>(
    ({ format= DEFAULT_DATE_FORMAT, ...props}, ref) => {
    const [state] = React.useState({ open: false })
    return <DatePicker
        format={format}
        {...props}
        ref={ref}
        onOpenChange={(open) => { state.open = open }}
        onKeyDown={(ev) => { if (state.open) ev.stopPropagation(); }}
    />
})

interface DateInputRangeProps {
    format?: string,
    disabled?: boolean,
    key?: string,
    allowClear?: boolean,
    showTime?: boolean,
    ref?: any,
    open?: boolean,
    locale?:any
}

export const DateInputRange = React.forwardRef<any, DateInputRangeProps>(
    ({format = DEFAULT_DATE_FORMAT, ...props}, ref) => {
    const [state] = React.useState({ open: false })
    return <RangePicker format={format}
        ranges={{
            'Сегодня': [moment().startOf('day'), moment().endOf('day')],
            'Тек.неделя': [moment().startOf('week'), moment().endOf('week')],
            'Тек.месяц': [moment().startOf('month'), moment().endOf('month')],
            'Пред.месяц': [moment().startOf('month').subtract(1, 'months'), moment().endOf('month').subtract(1, 'months')],
            'Тек.квартал': [moment().startOf('quarter'), moment().endOf('quarter')],
            'Тек.год': [moment().startOf('year'), moment().endOf('year')],
        }}
        {...props}
        ref={ref}
        onOpenChange={(open) => { state.open = open }}
        onKeyDown={(ev) => { if (state.open) ev.stopPropagation(); }}
    />
})

