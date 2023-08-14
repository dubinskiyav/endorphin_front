import React from 'react';
import { Tree } from 'antd';
import { MSG_REQUEST_ERROR } from './Const';
import { notification } from 'antd';
import requestToAPI from "./Request";
import withStyles, {WithStylesProps} from "react-jss";


const findTreeData = (root: any, id: any)=>{
    if(root.value==id) return root;
    const result = root.children.find((c: any)=>!!findTreeData(c,id));
    if(result) return result;
    return;
}

const findByTitle = (root: any, mask: string, result: any[])=>{
    if(root.title.toLowerCase().indexOf(mask.toLowerCase()) > -1) {
        result.push(root);
        let curr = root;
        while(curr.parent) {
            result.splice(0,0,curr.parent);
            curr = curr.parent;
        }
    }
    root.children.forEach((c: any) => {
        c.parent = root;
        findByTitle(c,mask,result);
    });
}
// JSS. Стили компонента
const styles = {
    tree: {
        overflowY: 'auto',
        overflowX: 'hidden',
    }
}

type rootElement = {
    title: string,
    value: number
}

interface DataTreeProps extends WithStylesProps<typeof styles> {
    uri: string,
    allowClear?: boolean,
    rootElement?: rootElement,
    defaultValue?: any,
    onChange?: (fvalue: any, svalue: any, tvalue: any) => void,
    interface?: any,
    treeNodeFilterProp?: string,
    showSearch?: boolean,
    style?: CSSStyleSheet,
    value?: any,
    onSelect?: () => void,
    [x:string]: any
}


export const DataTree = React.forwardRef<any, DataTreeProps>(
    ({style = {width: "100%"}, showSearch = true, classes,
         treeNodeFilterProp = "title", ...props}, ref) => {
        const {uri, rootElement, defaultValue, value, onChange, onSelect, ...treeprops} = props;
        let defaultValueItem;
        const [data, setData] = React.useState<any[] | null>(null);
        const [loading, setLoading] = React.useState<boolean>(false);
        const [currValue, setCurrValue] = React.useState<any[]>([]);
        const [expandedKeys, setExpandedKeys] = React.useState<any[]>([]);
        const [searchValue, setSearchValue] = React.useState<string>();
        const [autoExpandParent, setAutoExpandParent] = React.useState(true);

        const refreshData = React.useCallback(() => {
            setLoading(true);
            requestToAPI.post(props.uri, {})
                .then((response: any) => {
                    setLoading(false);
                    setData(response);
                    setExpandedKeys([-1]);
                })
                .catch(error => {
                    setLoading(false);
                    // в случае ошибки
                    setData([]);
                    notification.error({
                        message: MSG_REQUEST_ERROR,
                        description: error.message
                    });

                });
            // eslint-disable-next-line
        }, [props.uri]);

        if (data === null) {
            setData([]);
            refreshData();
        }


        if (defaultValue) {
            if (data === null) {
                if (defaultValue instanceof Object && defaultValue['value'] != -1) {
                    defaultValueItem = {value: defaultValue['value'], title: defaultValue['title']};
                } else {
                    defaultValueItem = rootElement;
                }
            } else {
                if (defaultValue instanceof Object) {
                    defaultValueItem = defaultValue;
                } else {
                    defaultValueItem = {value: defaultValue};
                }
            }

        }

        const handleChange: any = React.useCallback((val: any, ev: any, jumpFlag: boolean) => {
            if (val.length == 0) {
                return;
            }
            setCurrValue(val);
            if (onChange && data) {
                const obj = findTreeData(data[0], val);
                onChange(val, obj, jumpFlag);
            }
        }, [data, onChange]);

        const handleExpand = (expandedKeys: any) => {
            setExpandedKeys(expandedKeys);
            setAutoExpandParent(false);
        };

        if (props.interface) {
            props.interface.jump = (id: any) => {
                setCurrValue([id]);
                handleChange([id], null, true);
            };

            props.interface.search = (val: string) => {
                let items: any[] = [];
                if (val.length > 3 && data) {
                    findByTitle(data[0], val, items);
                }
                const keys = items.map(itm => itm.value);
                setExpandedKeys(keys);
                setSearchValue(val);
                setAutoExpandParent(false);
            };
        }


        // loading, defaultValue - свойства, которых нет в Tree
        return <Tree
            ref={ref}
            className={classes?.tree}
            // loading={loading}
            selectedKeys={currValue}
            treeData={data || (defaultValueItem ? [defaultValueItem] : [rootElement])}
            defaultExpandedKeys={defaultValueItem ? [defaultValueItem.value] : undefined}
            // defaultValue = {defaultValueItem?defaultValueItem.value:undefined}
            onSelect={handleChange}
            expandedKeys={expandedKeys}
            autoExpandParent={autoExpandParent}
            onExpand={handleExpand}
            filterTreeNode={(node: any) => {
                if (!searchValue)
                    return false;
                if (!node)
                    return false;
                return node.title.toLowerCase().indexOf(searchValue.toLowerCase()) > -1;
            }}
            {...treeprops} />;

    }) as unknown as CompoundedComponent;

interface CompoundedComponent extends React.ForwardRefExoticComponent<DataTreeProps> {
    Subject: any;
    SGood: any
}

interface DataTreeSubjectProps extends WithStylesProps<typeof styles>{

}

DataTree.Subject = React.forwardRef<any, DataTreeSubjectProps>((props, ref) => {
    const root = { title: "Объекты аналитического учета", value: -1 };
    return <DataTree ref={ref} uri={"refbooks/subject/subject/gettree"} rootElement={root} {...props} />
});
DataTree.SGood = React.forwardRef<any, any>((props, ref) => {
    const root = { title: "ТМЦ", value: -1 };
    return <DataTree ref={ref} uri={"refbooks/sgood/sgood/gettree"} rootElement={root} {...props} />
});

export default withStyles(styles)(DataTree);
