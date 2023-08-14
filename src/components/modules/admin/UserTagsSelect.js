import React from 'react';
import { Tag } from 'antd';
import MultiDataSelect from '../../lib/MultiDataSelect';


const UserTagsSelect = React.forwardRef(({tagmap,...otherprops},ref)=>{

    const tagRender = (tagprops)=>{
        const { label, value, closable, onClose } = tagprops;
        const usertag = tagmap[value];
        return (
            <Tag
              color={usertag.htmlColor}
              closable={closable}
              onClose={onClose}
              style={{ marginRight: 3 }}
            >
              {usertag.capClassCode}
            </Tag>
        );
    }

    const tagRenderInDropdown = (usertag)=>{
        return <span>
            <Tag
              color={usertag.htmlColor}
              style={{ marginRight: 8 }}
            >
              {usertag.capClassCode}
            </Tag>                        
            {usertag.capClassName}        
        </span>
    }

    return <MultiDataSelect key="proguserTags" 
        SelectProps={{maxTagCount:'responsive',tagRender:tagRender, showArrow: true}}
        // необязательный, используется, например, в кэше
        componentName={"proguserTags"}
        data={Object.values(tagmap)}
        valueName="capClassId"
        displayValueName={(r,flag)=>flag?r.capClassId:tagRenderInDropdown(r)}
        allowClear
        {...otherprops}
        />

})

UserTagsSelect.displayName = 'UserTagsSelect.multiple';

export default UserTagsSelect;