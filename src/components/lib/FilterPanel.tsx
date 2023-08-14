import React, {FC} from 'react';
import {Space} from 'antd';
import withStyles, { WithStylesProps } from 'react-jss'

// JSS. Стили компонента
const styles = {
    filter: {
        margin: '8px 0'
    },
}

// спецификация пропсов
interface FilterPanelProps extends WithStylesProps<typeof styles> {
    onChange: (value: any) => void,
    children: any
}

const FilterPanelImpl: FC<FilterPanelProps> = (props)=>{
    const [config] = React.useState<any>({});

    const changed = (key: string, val: any)=>{
        // искючения для checkbox. в val передается event
        if(typeof val === "object" && val.target.type=="checkbox") {
            val = val.target.checked;
        }
        config[key] = val;
        props.onChange(config);
    }
    let allFilters =  props.children.props.children;

    if(!allFilters.length) {
        allFilters = [allFilters];
    }
    return (
        <Space className={props.classes.filter}>
            {allFilters.map((c: any)=>React.cloneElement(c, {
                onChange: (value)=>changed(c.key,value),
                key:c.key
            }))}
        </Space>
    )
}

export const FilterPanel = withStyles(styles)(FilterPanelImpl)



