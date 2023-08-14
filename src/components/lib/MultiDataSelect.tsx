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

const PropertyesPopupMenu: FC<PropertyesPopupMenuProps> = ({ record, columns, visible,
                                                               x, y, selectInterface, setPopupState }) => {
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

interface MultiDataSelectProps {
    params?: any,
    componentName?: string,
    SelectProps?: any,
    valueName?: string,
    displayValueName: string | (() => void),
    displayValue?: string,
    uri?: string,
    allowClear?: boolean,
    value?: any[],
    casheType?: EnumCasheTypes.None | EnumCasheTypes.SessionStorage | EnumCasheTypes.LocalStorage,
    data?: any[],
    style?: CSSProperties | undefined,
    onChange?: (value: any) => void,
    key?: any,
    optionName?: string
}


const MultiDataSelect = React.forwardRef<any, MultiDataSelectProps>(
    ({valueName = "id", casheType = EnumCasheTypes.None, style= { width: 240 },
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
            if (props.uri) {
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
                    .catch(error => {
                        setLoading(false);
                        // в случае ошибки
                        setData([]);
                        notification.error({
                            message: MSG_REQUEST_ERROR,
                            description: error.message
                        })

                    })
            }

            // eslint-disable-next-line
        }, [props.uri])

        const dropdownVisibleChange = React.useCallback((open: any) => {
            if (open && data === null) {
                setData([]);
                refreshData();
            }
        }, [data, refreshData])

        let options;

        if (props.value && data === null) {
            options = props.value.map(d => {
                return <Option key={d.value.toString()} value={d.value}>{d.title}</Option>
            });
        }

        if (data) {
            options = data.map(d => <Option key={d[valueName]} value={d[valueName]}>{valueNameFunc(d)}</Option>);
        }

        const handleChange = React.useCallback((val: any) => {
            if (props.onChange) {
                if(val.length==0) {
                    props.onChange([]);
                } else 
                if(data) {
                    let valueObject : any[] = [];
                    val.forEach((element:any) => {
                        const disp = valueNameFunc(data.find(d => d[valueName] == element));
                        valueObject.push({ value: parseInt(element), title: disp });
                    });
                    props.onChange(valueObject);
                } else 
                if(props.value){
                    let valueObject : any[] = [];
                    val.forEach((element:any) => {
                        const v = props.value?.find(d => d.value == parseInt(element));
                        valueObject.push(v);
                    });
                    props.onChange(valueObject);
                }
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

        const handleFilter = React.useCallback((inputValue: string, option: any) => {
            return option.children.toUpperCase().indexOf(inputValue.toUpperCase())>=0
        },[]);

        return (<div>
                <Select {...props.SelectProps}
                        open={dropDownFlag}
                        locale={{
                            emptyText: "Нет данных"
                        }}
                        allowClear={props.allowClear}
                        ref={ref}
                        key={props.key}
                        loading={loading}
                        filterOption={handleFilter}
                        defaultValue={props.value ? props.value.map(el => el.title.toString()) : []}
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
                            // @ts-ignore
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
                                // убрать, иначе закрывается после первого выбора
                                //setDropDownFlag(false);
                                event.stopPropagation();
                            }
                        }}
                        onBlur={() => {
                            setDropDownFlag(false);
                            setPopupState({ visible: false });
                        }}
                        mode="multiple">
                    {options}
                </Select>
                <PropertyesPopupMenu {...popupState} selectInterface={{ refreshData: refreshData }} setPopupState={setPopupState} />
            </div>
        )
    })

MultiDataSelect.displayName = 'MultiDataSelect.multiple';

export default MultiDataSelect;