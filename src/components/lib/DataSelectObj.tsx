import React, {CSSProperties, FC} from 'react';
import { SyncOutlined } from '@ant-design/icons';
import { Select } from 'antd';
import { MSG_REQUEST_ERROR, CasheTypes } from './Const';
import { generateHash } from './Utils';
import { notification, Menu } from 'antd';
import requestToAPI from "./Request";

const { Option } = Select;

interface PropertyesPopupMenuProps {
    record: any,
    columns: any[],
    visible: boolean,
    x: number,
    y: number,
    selectInterface: any,
    setPopupState: (value: any) => void
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


interface DataSelectObjProps {
    params?: any,
    componentName?: string,
    SelectProps?: any,
    valueName?: string,
    displayValueName: string | (() => void),
    displayValue?: string,
    uri?: string,
    allowClear?: boolean,
    value?: any,
    casheType?: EnumCasheTypes.None | EnumCasheTypes.SessionStorage | EnumCasheTypes.LocalStorage,
    data?: any[],
    interface?: any,
    style?: CSSProperties | undefined,
    onChange?: (value: any) => void,
    key?: any
}



const DataSelectObj = React.forwardRef<any, DataSelectObjProps>(
    ({valueName = "id", casheType = EnumCasheTypes.None, style = { width: 240 },
         ...props}, ref: any) => {
    const [data, setData] = React.useState(props.data ?? null);
    const [loading, setLoading] = React.useState(false);
    const [dropDownFlag, setDropDownFlag] = React.useState(false);
    const [popupState, setPopupState] = React.useState<any>({
        visible: false,
        x: 0, y: 0
    });

    if (props.data && props.data !== data) {
        setData(props.data);
    }

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
            if (props.uri) {
                let response = getResponseFromCashe(genCasheKey(props.uri, props.params))
                if (response) {
                    setData(response);
                    return;
                }
            }

        }
        setLoading(true);
        if(props.uri) {
            requestToAPI.post(props.uri, props.params)
                .then((response: any) => {
                    setLoading(false);
                    response = response.result;
                    // помещение в кэш
                    if (props.uri) {
                        if (response && casheType != CasheTypes.None) {
                            saveResponseToCashe(genCasheKey(props.uri, props.params), response)
                        }
                        setData(response);
                    }

                })
                .catch((error: any) => {
                    setLoading(false);
                    // в случае ошибки
                    setData([]);
                    notification.error({
                        message: MSG_REQUEST_ERROR,
                        description: error.message
                    })

                })
        }

    }, [props.uri,props.params,casheType,genCasheKey,getResponseFromCashe,saveResponseToCashe])

    const dropdownVisibleChange = React.useCallback((open: any) => {
        if (open && data === null) {
            setData([]);
            refreshData();
        }
    }, [data, refreshData])

    let options;

    if (props.value && data === null && props.value.value !== null) {
        options = [<Option key={props.value.value.toString()} value={props.value.value.toString()}>{props.value.title}</Option>];
    }

    if (data) {
        options = data.map(d => <Option key={d[valueName]} value={d[valueName]}>{valueNameFunc(d)}</Option>);
    }

    const handleChange = React.useCallback((val: any) => {
        if (props.onChange && data) {
            props.onChange({ value: val, title: valueNameFunc(val) });
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
        props.interface.getDisplayValue= (val: any) => valueNameFunc(data?data.find(d => d[valueName] == val):undefined)
        props.interface.resetData = () => setData(null)
    }

    return (<div>
        <Select {...props.SelectProps}
            value={options?undefined:null} // важная штука. очищает содержимое select при отсутвии options
            open={dropDownFlag}
            locale={{
                emptyText: "Нет данных"
            }}
            allowClear={props.allowClear}
            ref={ref}
            key={props.key}
            loading={loading}
            defaultValue={(props.value && props.value.value) ? props.value.value.toString() : undefined}
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
            onClick={(event: any) => {
                if (!dropDownFlag) {
                    setPopupState({ visible: false })
                    setDropDownFlag(true);

                    document.addEventListener(`click`, function onClickOutside(event: any) {
                        for (const i in event.path) {
                            if (event.path[i].classList && event.path[i].classList.contains("ant-select-item")) {
                                return;
                            }
                        }
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
                setPopupState({ visible: false });
            }}>
            {options}
        </Select>
        <PropertyesPopupMenu {...popupState} selectInterface={{ refreshData: refreshData }} setPopupState={setPopupState} />
    </div>
    )
})

export default DataSelectObj;
