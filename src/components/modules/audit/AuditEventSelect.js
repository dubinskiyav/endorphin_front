import React from 'react';
import { Select } from 'antd';
import {EVENT_KINDS} from "../../lib/Const";

const { Option } = Select;


const AuditEventSelect = React.forwardRef((props, ref) => {
    const {...otherprops} = props;

    return <Select labelInValue
        mode="multiple"
        maxTagCount='responsive'
        showArrow
        ref={ref}
        {...otherprops}>
        {EVENT_KINDS.slice(1).map((name,idx)=><Option key={idx+1}>{name}</Option>)}
        {<Option key={101}>Интеграция: входящие сообщения</Option>}        
        {<Option key={102}>Интеграция: исходящие сообщения</Option>}        
    </Select>
});

export default AuditEventSelect;
