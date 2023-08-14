import React, {CSSProperties, FC} from 'react';
import withStyles,{WithStylesProps} from 'react-jss'
import { SyncOutlined } from '@ant-design/icons';
import { Select } from 'antd';
import { MSG_REQUEST_ERROR, CasheTypes } from './Const';
import { generateHash,componentAsText } from './Utils';
import { notification, Menu } from 'antd';
import requestToAPI from "./Request";

const { Option } = Select;

// JSS. Стили компонента
const styles = {
    'lock-visible-select-dropdown':{
        display:'none'
    }
}


interface PropertyesPopupMenuProps {
    record: any,
    columns: any[],
    visible: boolean,
    x: number,
    y: number,
    selectInterface: any,
    setPopupState: (value: any) => void
}

export interface DataSelectMethods {
    getDisplayValue: (val: any) => Function,
    resetData: () => void,
    refreshData: () => void,
    refreshAndSetValue: (newvalue: string | number | null) => void,
}

const PropertyesPopupMenu: FC<PropertyesPopupMenuProps> = ({ record, columns, visible, x, y, selectInterface, setPopupState }) => {
    return (
        visible
            ? <div className="ant-popover ant-popover-inner" style={{ left: `${x}px`, top: `${y}px`, position: "fixed" }}>
                <Menu>
                    <Menu.Item key='1' icon={<SyncOutlined />} onClick={() => { selectInterface.refreshData(true); setPopupState({ visible: false }) }}>Обновить</Menu.Item>
                </Menu>
            </div>
            : null
    )
}

enum EnumCasheTypes {
    None = 0,
    SessionStorage = 1,
    LocalStorage = 2
}

interface DataSelectProps extends WithStylesProps<typeof styles> {
    id?:string,
    params?: any,
    componentName?: string,
    SelectProps?: any,
    valueName?: string,  // default "id"
    displayValueName: string | ((fvalue: any, svalue: any) => void),
    displayValue?: string,
    uri: string,
    allowClear?: boolean,
    value?: string | number,
    casheType?: EnumCasheTypes.None | EnumCasheTypes.SessionStorage | EnumCasheTypes.LocalStorage,
    interface?: any,
    onChange?: (fvalue: any, svalue: any) => void,
    style?: CSSProperties,
    ref?: any,
    optionName?: string,
    className?:string,
    nullDataFunc?: () => any,
    getResultFunc?: (response:any) => any
}

const DataSelect = React.forwardRef<any, DataSelectProps>(({classes, valueName = "id", casheType = EnumCasheTypes.None,
                                                                        style = { width: 240 }, ...props}, ref:any) => {
    const [data, setData] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(false);
    const [dropDownFlag, setDropDownFlag] = React.useState(false);
    const [popupState, setPopupState] = React.useState<any>({
        visible: false,
        x: 0, y: 0
    });
    const [lockClassName, setLockClassName] = React.useState<string | undefined>();


    let valueNameFunc: any = props.displayValueName;
    if (typeof props.displayValueName === 'string') {
        valueNameFunc = (r: any, flag?: boolean) => r ? r[props.displayValueName as string] : "";
    }

    const genCasheKey = React.useCallback((uri: string, params: any) => {
        return "DataSelect." +
            (props.componentName ? props.componentName + "." : "?.") +
            generateHash(uri + (params ? "#" + JSON.stringify(params) : ""));
    }, [props.componentName]);

    const getResponseFromCashe = React.useCallback((key: string) => {
        const storage = CasheTypes.getStorage(casheType);
        if (storage) {
            const sdata = storage.getItem(key);
            return sdata ? JSON.parse(sdata) : undefined;
        }
    }, [casheType]);

    const saveResponseToCashe = React.useCallback((key: string, data: any) => {
        const storage = CasheTypes.getStorage(casheType);
        if (storage) {
            storage.setItem(key, JSON.stringify(data));
        }
    }, [casheType]);

    const refreshData = React.useCallback((nocashe?: any) => {
        // извлечение из кэша
        if (casheType != CasheTypes.None && !nocashe) {
            let response = getResponseFromCashe(genCasheKey(props.uri, props.params))
            if (response) {
                setData(response);
                return Promise.resolve(response);
            }
        }
        setLoading(true);
        return requestToAPI.post(props.uri, props.params)
            .then((response: any) => {
                response = props.getResultFunc?props.getResultFunc(response):response.result;
                // помещение в кэш
                if (response && casheType != CasheTypes.None) {
                    saveResponseToCashe(genCasheKey(props.uri, props.params), response)
                }
                setData(response);
                if (response?.length === 0) {
                    props?.nullDataFunc && props.nullDataFunc()
                }
                return response;
            })
            .catch(error => {
                // в случае ошибки
                setData([]);
                notification.error({
                    message: MSG_REQUEST_ERROR,
                    description: error.message
                })
            })
            .finally(()=>{
                setLoading(false);
            });
    }, [props.uri,props.params,casheType,genCasheKey,getResponseFromCashe,saveResponseToCashe])

    const dropdownVisibleChange = React.useCallback((open: any) => {
        if (open && data === null) {
            setData([]);
            refreshData();
        }
    }, [data, refreshData])

    let options;

    if (props.value && data === null) {
        options = <Option key={props.value} value={props.value}>{props.displayValue}</Option>;
    }

    if (data) {
        options = data.map((d: any) => {
            return <Option key={d[valueName]} value={d[valueName]}>{valueNameFunc(d)}</Option>
        });
    }
    const handleChange = React.useCallback((val: any) => {
        setDropDownFlag(false);
        if (props.onChange && (val==undefined || data)) {
            // Костыль
            // второй аргумент в valueNameFunc указывает, что нужно вернуть
            // не ввиде JSX (это для ьех DataSelect, которые хотят форматированного вывода в Option), а в виде строки
            // так как панель фильтров отслеживает тип второго аргумента в props.onChange

            // используется из-за внедрения value в option
            let disp: any;
            let value = props.displayValueName
            if (typeof val === 'string'){
                // случай JSX в option
                if (props.optionName) {
                    value = props.optionName
                }
                disp = val
                let record = data?.find((d: any) => d[value as string] == disp)
                val = record ? record[valueName] : ""
            } else {
                disp = data?valueNameFunc(data.find((d: any) => d[valueName] == val),true):""
            }
            props.onChange(val != undefined?parseInt(val):undefined, disp);
        }
    }, [data, props, valueNameFunc])

    const handleKeyDown = React.useCallback((ev: any) => {
        if (dropDownFlag) ev.stopPropagation();

        if (ev.keyCode >= 37 && ev.keyCode <= 40) {
            setDropDownFlag(true);
        };
        if (ev.keyCode == 27 && dropDownFlag) {
            setDropDownFlag(false);
            ev.preventDefault();
        }
        if (ev.keyCode == 13) {
            setDropDownFlag(false);
        }

    }, [dropDownFlag]);

    // interface содержит методы, которые можно применять к функциональному компоненту
    // в стиле компонента, построенного на классах
    if (props.interface) {
        props.interface.getDisplayValue = (val: any) => {
            if(data) {
                const obj = data.find((d: any) => d[valueName] == val);
                return valueNameFunc(obj)
            } else {
                return val===props.value?props.displayValue:undefined;
            }                        
        }
        props.interface.resetData = () => setData(null)
        props.interface.refreshData = () => refreshData(true)
        // метод позволяет обновить данные и установить текущее значение
        props.interface.refreshAndSetValue = (newvalue: string | number | null) =>{
            refreshData()?.then((data)=>{
                if(!props.id) {
                    throw Error("For call 'openAndSetValue' props.id needed")
                }
                let idx = -1;
                if(newvalue !== null) {
                    idx = data.findIndex((d: any) => d[valueName] === newvalue);
                }
                // kav: здесь код, позволяющий установить текущуее значение в списке выбора. Так ка в antd
                // это можно сделать только в управляемом режиме (а компоенет работает не в этом режиме)
                // приходится приседать не по детски
                if(idx>=0) {

                    //блокируем всплытие списка, чтобы не моргало
                    setLockClassName(classes["lock-visible-select-dropdown"]);

                    setDropDownFlag(true);
                    setTimeout(()=>{
                        const rclist = document.querySelector("#"+props.id+"_list")?.parentElement;
                        const items:any = rclist?.querySelectorAll(".ant-select-item-option");
                        if(items.length>idx) {
                            items[idx].click();
                        }
                        setDropDownFlag(false);
                        // снимаем блокировку
                        setLockClassName(undefined);
                    },100)

                }

            });
        }
    }

    return (<div className={props.className}>
        <Select {...props.SelectProps}
            className={lockClassName}
            id={props.id}
            value={options?undefined:null} // важная штука. очищает содержимое select при отсутвии options
            open={dropDownFlag}
            locale={{
                emptyText: "Нет данных"
            }}
            allowClear={props.allowClear}
            ref={ref}
            loading={loading}
            defaultValue={props.displayValue ? "" + props.displayValue : ''}
            onDropdownVisibleChange={dropdownVisibleChange}
            onChange={handleChange}
            style={{ ...style }}
            onKeyDown={handleKeyDown}
            onContextMenu={(event: any) => {
                // system menu
                if (event.ctrlKey) {
                    return
                }
                event.preventDefault();
                event.stopPropagation();

                document.addEventListener(`click`, function onClickOutside() {
                    setPopupState({ visible: false })
                    document.removeEventListener(`click`, onClickOutside)
                })
                setDropDownFlag(false);
                if(ref && ref.current) ref.current.focus();
                setPopupState({
                    visible: true,
                    x: event.clientX,
                    y: event.clientY
                })
            }}
            onClick={event => {
                if (!dropDownFlag) {
                    setPopupState({ visible: false })
                    setDropDownFlag(true);

                    document.addEventListener(`click`, function onClickOutside() {
                        setDropDownFlag(false);
                        document.removeEventListener(`click`, onClickOutside)
                    })
                    event.stopPropagation();
                } else {
                    setDropDownFlag(false);
                    event.stopPropagation();
                }
            }}
            onBlur={() => {
                setDropDownFlag(false);
                // setPopupState({ visible: false });
            }}
            showSearch={true}
            filterOption={(input, option) =>
                componentAsText(option).toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            onSearch={() => {
                setDropDownFlag(true);
                setPopupState({ visible: false });
            }}
        >
            {options}
        </Select>
        <PropertyesPopupMenu {...popupState} selectInterface={{ refreshData: refreshData }} setPopupState={setPopupState} />
    </div>
    )
}) as CompoundedComponent

interface CompoundedComponent extends React.ForwardRefExoticComponent<DataSelectProps> {
    CapClassSelect: any;
    AccessRoleSelect: any;
    CapCodeSelect: any
}


interface CapCodeSelectProps extends WithStylesProps<typeof styles> {
    capCodeType: number
}

DataSelect.CapCodeSelect = withStyles(styles)(React.forwardRef<any, CapCodeSelectProps>((props, ref) => {
    const { capCodeType, ...otherprops } = props;

    return <DataSelect ref={ref}
        uri={"system/capcode/getlist"} params={{ capCodeTypeId: capCodeType }}
        valueName="capCodeId"
        displayValueName="capCodeName"
        casheType={CasheTypes.LocalStorage}
        {...otherprops} />
}))




interface CapClassSelectProps extends WithStylesProps<typeof styles> {
    capClassType: number,
    sortField?: string
}

DataSelect.CapClassSelect = withStyles(styles)(React.forwardRef<any, CapClassSelectProps>((props, ref) => {
    const { capClassType, sortField, ...otherprops } = props;

    return <DataSelect ref={ref}
        uri={"system/capclass/getlist"} params={{ capClassTypeId: capClassType, capClassBlockFlag:0, sortField}}
        valueName="capClassId"
        displayValueName="capClassName"
        casheType={CasheTypes.LocalStorage}
        {...otherprops} />
}));

interface AccessRoleSelectProps extends WithStylesProps<typeof styles> {

}

DataSelect.AccessRoleSelect = withStyles(styles)(React.forwardRef<any, AccessRoleSelectProps>((props, ref) => {

    return <DataSelect
        uri={"admin/credential/accessrole/getlist"}
        params={{
            "pagination": {
                "current": 1,
                "pageSize": -1
            },
            "sort": [
                {
                    "field": "accessRoleName",
                    "order": "ascend"
                }
            ],
            "filters":{
                "onlyVisible":1
            }
        }}
        valueName="accessRoleId"
        // случай когда JSX в option - используется как альтернатива displayValueName
        optionName="accessRoleName"
        displayValueName={(r:any, forChange?: any)=> !forChange ? <><div>{r?.accessRoleName}</div><div>{r?.accessRoleNote}</div></>:r?.accessRoleName}
        {...props}/>

}));



DataSelect.displayName = 'DataSelect';
DataSelect.AccessRoleSelect.displayName = 'DataSelect.AccessRoleSelect';
DataSelect.CapClassSelect.displayName = 'DataSelect.CapClassSelect';
DataSelect.CapCodeSelect.displayName = 'DataSelect.CapCodeSelect';

export default withStyles(styles)(DataSelect);
