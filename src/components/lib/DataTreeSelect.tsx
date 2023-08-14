import React, {CSSProperties} from 'react';
import { TreeSelect } from 'antd';
import { MSG_REQUEST_ERROR } from './Const';
import { notification } from 'antd';
import requestToAPI from "./Request";


const findTreeData = (root: any, id: number) => {
    if (root.value == id) return root;
    const result = root.children.find((c: any) => !!findTreeData(c, id));
    if (result) return result;
    return;
}

interface DataTreeSelectProps {
    uri: string,
    allowClear?: boolean,
    rootElement?: object,
    defaultValue?: object | number,
    treeNodeFilterProp?: string,
    style?: CSSProperties | undefined,
    showSearch?: boolean,
    value?: any,
    onChange?: (v1: any, v2: any) => void
}

const DataTreeSelect = React.forwardRef<any, DataTreeSelectProps>(
    ({treeNodeFilterProp= "title", style= { width: "100%" }, showSearch= true, ...props}, ref) => {
    const { uri, rootElement, defaultValue, value, onChange, ...treeprops } = props;
    let defaultValueItem: any;

    const [data, setData] = React.useState<any[] | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [state] = React.useState<any>({});


    const refreshData = React.useCallback(() => {
        setLoading(true);
        requestToAPI.post(props.uri, {})
            .then((response: any) => {
                setLoading(false);
                setData(response);
            })
            .catch(error => {
                setLoading(false);
                // в случае ошибки
                setData([]);
                notification.error({
                    message: MSG_REQUEST_ERROR,
                    description: error.message
                })

            })
        // eslint-disable-next-line
    }, [props.uri])

    const dropdownVisibleChange = React.useCallback((open: any) => {
        state.open = open;
        if (open && data === null) {
            setData([]);
            refreshData();
        }
    }, [data, refreshData, state])

    const mergedValue: any = defaultValue ?? value;
    if (mergedValue) {
        if (data === null) {
            if (mergedValue instanceof Object && mergedValue['value'] != -1) {
                defaultValueItem = { value: mergedValue['value'], title: mergedValue['title'] };
            } else {
                defaultValueItem = rootElement
            }


        } else {
            if (mergedValue instanceof Object) {
                defaultValueItem = mergedValue;
            } else {
                defaultValueItem = { value: mergedValue }
            }
        }
    }

    const handleChange = React.useCallback((val: any, label: any) => {
        if (onChange) {
            if (data !== null && data.length > 0) {
                    const obj = findTreeData(data[0], val)
                    onChange({ value: val }, obj);
            }
        }
    }, [data, onChange])


        // свойство locale не существует в TreeSelect
        return <TreeSelect
        // locale={{
        //     emptyText: "Нет данных"
        // }}
        ref={ref}
        onDropdownVisibleChange={dropdownVisibleChange}
        loading={loading}
        treeData={data || (defaultValueItem ? [defaultValueItem] : [rootElement])}
        treeDefaultExpandedKeys={defaultValueItem ? [defaultValueItem.value] : undefined}
        defaultValue={defaultValueItem ? defaultValueItem.value : undefined}
        onChange={handleChange}
        {...treeprops}
    />

}) as CompoundedComponent;



interface CompoundedComponent extends React.ForwardRefExoticComponent<DataTreeSelectProps> {
    Subject: any;
}

DataTreeSelect.Subject = React.forwardRef<any, any>((props, ref) => {
    const root = { title: "Объекты аналитического учета", value: -1 };
    return <DataTreeSelect ref={ref} uri={"refbooks/subject/subject/gettree"} rootElement={root} {...props} />
});

export default DataTreeSelect;
