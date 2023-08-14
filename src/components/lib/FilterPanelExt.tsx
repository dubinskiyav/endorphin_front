import React, {FC} from 'react';
import { Space, Collapse, Dropdown, Menu,Input, Checkbox } from 'antd';
import { CloseCircleOutlined, MenuOutlined, DeleteOutlined } from '@ant-design/icons';
import { DesktopOrTabletScreen } from './Responsive';
import * as PreferenceStorage from './PreferenceStorage'
import * as PreferenceGlobalStorage from './PreferenceGlobalStorage'
import * as Utils from './Utils'
import * as Dialogs from './Dialogs'
import {
    makeToServer,
    extractValuesFromInitFilters, createFilterItem, normalizeInputValue,
    resetToInitValues,
    getInitValues
} from './FilterUtils';
import withStyles, {WithStylesProps} from "react-jss";
import {debounce} from "./Utils";

const { Panel } = Collapse;

const AUTO_SAVE_MENU_LABEL="Последнее автосохраненное состояние";

interface PrimaryProps {
    children: React.ReactNode
}

export const Primary = (props: PrimaryProps) => {
    return <React.Fragment>{props.children}</React.Fragment>
}

export enum SavedFilterState {
    Load = 1,
    Save = 2,
    Remove = 3
}

const buildKey=(key: any)=>"modfilter."+window.location.pathname.slice(1).replace("/",".")+"."+key;

const buildSectionFilter = (children: any)=>{
    let primaryFilters = [];
    let otherFilters: any[] = [];
    React.Children.map(children, c => {
        if (Primary.name == c.type.name) {
            React.Children.map(c.props.children, cc => primaryFilters.push(cc));
        } else {
            otherFilters.push(c);
        }
    });
    // если нет primary filters, а только other filters,
    // other становятся primary
    if (primaryFilters.length == 0 && otherFilters.length > 0) {
        primaryFilters = otherFilters;
        otherFilters = [];
    }
    return [primaryFilters,otherFilters];
}

const transformStoredValue = (storedesk:any,value:any)=>((storedesk && storedesk.transformValue)?storedesk.transformValue(value):value);
const transformPrefValueForSave = (storedesk:any,value:any, initprops:any)=>((storedesk && storedesk.transformToSavedValue)?storedesk.transformToSavedValue(value, initprops):value);
const makeStoreKey = (key:string)=>((window.location.pathname.slice(1) || 'root')+"."+key);

export const savedFilterList = ()=>{
    const allfilterNames = PreferenceGlobalStorage.loadPreference(makeStoreKey("filters")) || {};
    return Object.keys(allfilterNames).map(key=>({key:key, label:allfilterNames[key]}))
}    

// JSS. Стили компонента
const styles = {
    'filter-panel':{
        margin: '8px 0'
    }
}

interface FilterPanelExtProps extends WithStylesProps<typeof styles> {
    children?: any,
    initValues: any,
    onChange: (value: any) => void,
    storeFilter?: any,
    factoryInitValues?: any,
    manualSet?: any,
    autoSaveState?:boolean,
    filterStored?:boolean,
    interface?:any,
    chooseFilterOnSave?:boolean,
    debounceTimeout?:number,
    optionFilters?:any,
    afterProcessFilterPreference?:(type:SavedFilterState,item:any)=>void
}


const FilterPanelExtImpl:FC<FilterPanelExtProps> = (props) => {
    // разбиваем по секциям
    const [primaryFilters,otherFilters] = buildSectionFilter(props.children.props.children);

    const [config] = React.useState(()=>{
        let initconfig = extractValuesFromInitFilters(props.initValues);
        // читаем предпочтения пользователей, если есть props storeFilter
        if(props.storeFilter) {
            const prefix = buildKey("");
            PreferenceStorage.enumPreferences((key: any) => {
                if(key.startsWith(prefix)) {
                    const filterKey = key.slice(prefix.length);
                    // для чтения надо чтобы фильтр был в storeFilter
                    if(props.storeFilter[filterKey]) {
                        let prefval = PreferenceStorage.loadPreference(key);
                        console.log("load filter from session key=",key,"value=", prefval);

                        // трансформируем, если это необходимо
                        const storedesk = props.storeFilter[filterKey];
                        prefval = (storedesk && storedesk.transformValue)?storedesk.transformValue(prefval):prefval;

                        // плохое компромисное решение!
                        // это нужно для того чтобы изменить значения начального фильтра в модуле
                        // props.initValues неизменна, но ее содержимое может меняться
                        props.initValues[filterKey]=prefval;

                    }
                }
            })
            // после чтения initValues изменился, поэтому нужно заново посчитать initconfig
            initconfig = extractValuesFromInitFilters(props.initValues);
        }
        return initconfig;
    });
    const [refs] = React.useState({});

    const [factoryInitValues] = React.useState(props.factoryInitValues || props.initValues);
    // строгая перезагрузка с размотированием компонент
    const [hardRefresh, setHardRefresh] = React.useState(false);
    React.useEffect(() => { setHardRefresh(false) }, [hardRefresh]);

    // ручная установка фильтров
    if(props.manualSet) {
        props.manualSet(config);
    }

    const changed = React.useCallback((key: any, val: any, option: any) => {

        let storeval = normalizeInputValue(val);

        // исключения для списков
        if(option && val) {
            // Исключение для DataSelect!
            // option появляется из DataSelect в виде строки, а для multiple в виде boolean
            if(typeof option==="string" || typeof option==="boolean") {
                if(typeof option==="string") {
                    storeval = {
                        propInitName:["value","displayValue"],
                        initValue:[val,option]
                    }
                } else {
                    storeval = {
                        propInitName:["value"],
                        initValue:val
                    }
                }
            } else {
                // Исключение для DataLookup!
                // option появляется из DataLookup
                storeval = {
                    initValue:{
                        value:option.id,
                        title:option.value
                    }
                }
            }
        }

        // сохраняем в предпочтениях
        if(props.storeFilter && props.storeFilter[key]) {
            console.log("save filter to session: key=",key," value=",storeval);
            PreferenceStorage.savePreference(buildKey(key),storeval);
            // если сбросили значение фильтра, его нужно очистить в initFilters
            if(!val) {
                delete props.initValues[key];
            }
        }
        config[key] = normalizeInputValue(val);
        // исключения для списков
        if(option && val) {
            // Исключение для DataSelect!
            // option появляется из DataSelect в виде строки
            if(typeof option==="string") {
                config[key] = {
                    value:val,
                    title:option
                }
            } else
                // Исключение для DataSelect в режиме !
                // option появляется из DataSelect в виде строки multiple select
                if(typeof option==="boolean") {
                    // оставляем как есть
                } else {
                    // Исключение для DataLookup!
                    // option появляется из DataLookup
                    config[key] = {
                        value:option.id,
                        title:option.value
                }
            }
        }
        props.onChange(makeToServer(config));

        if(props.autoSaveState) {
            saveFilterPreference(AUTO_SAVE_MENU_LABEL);
        }

    }, [config, props])

    const changedDebounce = debounce(changed, props.debounceTimeout ?? 1000)

    const genExtra = React.useCallback((refs: any) => (
        <CloseCircleOutlined style={{ display: "inline" }} onClick={event => {
            // удаляем все из предпочтений
            PreferenceStorage.dropPreference(Object.keys(config).map(k=>buildKey(k)));

            event.stopPropagation();
            resetToInitValues(refs, config, factoryInitValues || props.initValues);
            // заменим содержимое в initValues
            Object.keys(props.initValues).forEach((key)=>{delete props.initValues[key]});
            Object.keys(config).forEach((key)=>{props.initValues[key]=config[key]});

            // обновление
            props.onChange(makeToServer(config));

            // необходимо размонтировать,
            // чтобы default значения у компонент вступили в действия
            setHardRefresh(true);
        }} />
    ), [config, props,factoryInitValues]);

    const createInnerItems = React.useCallback((items: any) => {
        return (
            <>
                {items.map((c: any, index: number) => {
                    if(c.type == Space) {
                        const { children, ...otherProps } = c.props;
                        if (children) {
                            otherProps.children = createInnerItems(children);
                        }
                        otherProps.key = index;
                        return React.createElement(Space, otherProps);
                    } else if (typeof c.type != "string"  && c.type != React.Fragment) { // отсекаем не компоненты, для тегов span, div и т.д. это не нужно
                        const changeHandler =  (props.optionFilters || {})[c.key]?.debounce?changedDebounce:changed;
                        return createFilterItem(c, refs, props.initValues, changeHandler);
                    } else {
                        return React.cloneElement(c, { key: "" });
                    }
                })}
            </>
        )
    }, [refs, changed,props.initValues]);

    const saveFilterPreference = (storeName:string,saveFilterList?:any)=>{
        const storeKey = Utils.generateHash(storeName);
        // обновляем список досупных фильтров
        const allfilterNames = PreferenceGlobalStorage.loadPreference(makeStoreKey("filters")) || {};
        allfilterNames[storeKey]=storeName;
        PreferenceGlobalStorage.savePreference(makeStoreKey("filters"),allfilterNames);
        // сохраняем сам фильтр
        let storeFilters = Object.keys(props.storeFilter);
        // если передан список извне только им ограничиваемся
        if(saveFilterList) {
            storeFilters=saveFilterList;
        }
        storeFilters.forEach(key=>{
            const valFilter = config[key];
            // фильтры без установленных значений удаляется
            if (valFilter === undefined ||
                // проверим на путые значения массива. Пустые значения удаляются
                Array.isArray(valFilter) && valFilter.length === 0 ||
                // проверим на путые значения объект. Пустые значения удаляются
                typeof valFilter=='object' && Object.keys(valFilter).length === 0) {
    
                // удаляем ранее сохраненный фильтр (фильтры могут перезаписываться)
                PreferenceGlobalStorage.savePreference(makeStoreKey(storeKey+"--"+key),undefined)
            } else {
                const flt = transformPrefValueForSave(props.storeFilter[key],valFilter,props.initValues[key]);
                PreferenceGlobalStorage.savePreference(makeStoreKey(storeKey+"--"+key),flt)
            }
        })
        if(props.afterProcessFilterPreference) {
            props.afterProcessFilterPreference(SavedFilterState.Save,{key:storeKey,label:storeName});
        }    
    }

    const loadAndApplyFilterPreference = (storeKey:string)=>{
        const loadFilters:any={};

        PreferenceGlobalStorage.enumPreferences(key=>{
            const prefix = makeStoreKey(storeKey+"--");
            if(key.startsWith(prefix)) {
                const filterKey = key.slice(prefix.length);
                let flt = PreferenceGlobalStorage.loadPreference(key);
                    
                // трансформируем, если это необходимо
                // в основном из-за дат, но и другие типы данных могут при сохранении принять иной вид - их нужно восстановить
                const initflt = transformStoredValue(props.storeFilter[filterKey],flt);
    
                props.initValues[filterKey]=initflt;
                config[filterKey]=getInitValues(initflt)[0];
                // индикатор, что фиьотр загрузился
                loadFilters[filterKey] = true;                

                // сохраняем в предпочтениях
                if(props.storeFilter && props.storeFilter[filterKey]) {
                    console.log("save filter to session: key=",filterKey," value=",flt);
                    PreferenceStorage.savePreference(buildKey(filterKey),flt);
                } 

            }    
        });
    
        //проблема с фильтрами установленными вручную. 
        // Они могут отсутсвовать в props.initValues и присутвовать в config
        // это приводит к тому, что фильтры отправляются на сервер, но в визульных компонентах пусто
        Object.keys(config).forEach(k=>{
            if(config[k] !== undefined && !loadFilters[k]) {
                const initval = transformPrefValueForSave(props.storeFilter[k],config[k],props.initValues[k])
                props.initValues[k] = initval;
            }
        })
    
        props.onChange(makeToServer(config));
        setHardRefresh(true);
    }

    const saveSimpeStateHandle=()=>{
        Dialogs.inputValue("Сохранение состояния","Введите имя сохраняемого состояния",(val)=>{
            saveFilterPreference(val);
        });
    }

    const saveStateHandle=()=>{
        const options = Object.keys(props.storeFilter).map(k=>({value:k,label:props.storeFilter[k].name}))
        let chooseFilters = options.map(v=>v.value);
        const onChangeFiltersHandle = (checkedValues:any)=>{chooseFilters=checkedValues}

        Dialogs.inputData("Сохранение состояния",
            <>
                <Input className='state-name' placeholder="Введите имя сохраняемого состояния" />
                <div style={{margin:'8px 0px'}}>Отметьте фильтры, которые нужно сохранить: </div>
                <Checkbox.Group options={options} defaultValue={options.map(v=>v.value)} onChange={onChangeFiltersHandle}/>
            </>,
            (elem:Element)=>{
                const input:any = elem.querySelector(".state-name");
                if (!input.value || input.value == '') {
                    return false;
                }
                if(chooseFilters.length==0) {
                    return false;
                }
                saveFilterPreference(input.value,chooseFilters);
                return true;
            });
    }

    const loadStateHandle =(item:any)=>{
        loadAndApplyFilterPreference(item.key)
        if(props.afterProcessFilterPreference) {
            if(!item.label) {
                const allfilterNames = PreferenceGlobalStorage.loadPreference(makeStoreKey("filters")) || {};
                item.label = allfilterNames[item.key];
            }
            props.afterProcessFilterPreference(SavedFilterState.Load,item);
        }
    }

    const stateDeleteHandle = (elem:any)=>{
        Dialogs.confirm("Удалить сохраненное состояние?",()=>{
            const storeKey = elem.target.parentNode.id;
            // обновляем список досупных фильтров
            const allfilterNames = PreferenceGlobalStorage.loadPreference(makeStoreKey("filters")) || {};
            const storeLabel = allfilterNames[storeKey];
            delete allfilterNames[storeKey];
            PreferenceGlobalStorage.savePreference(makeStoreKey("filters"),allfilterNames);
            //чистим фильтры
            PreferenceGlobalStorage.enumPreferences(key=>{
                if(key.startsWith(makeStoreKey(storeKey+"--"))) {
                    PreferenceGlobalStorage.dropPreference(key);
                }    
            });
            if(props.afterProcessFilterPreference) {
                props.afterProcessFilterPreference(SavedFilterState.Remove,{key:storeKey,label:storeLabel});
            }    
        })
    }

    const menuStoreFilters = ()=>{
        const allfilterNames = PreferenceGlobalStorage.loadPreference(makeStoreKey("filters")) || {};
        // исключим автосохранение
        const storeAutoSaveKey = Utils.generateHash(AUTO_SAVE_MENU_LABEL);
        if(allfilterNames[storeAutoSaveKey]) {
            delete allfilterNames[storeAutoSaveKey];
        }
        return <Menu>
                    <Menu.Item key="save" onClick={props.chooseFilterOnSave?saveStateHandle:saveSimpeStateHandle}>Сохранить состояние ...</Menu.Item>
                    <Menu.SubMenu key="load" title="Загрузить состояние">
                        {
                            props.autoSaveState?
                                <>
                                    <Menu.Item key={storeAutoSaveKey} className="mnu-filter-delete" onClick={loadStateHandle}>{AUTO_SAVE_MENU_LABEL}</Menu.Item>
                                    <Menu.Divider/>
                                </>
                                :undefined
                        }    
                        {Object.keys(allfilterNames).map(key=><Menu.Item key={key} className="mnu-filter-delete" onClick={loadStateHandle}>{allfilterNames[key]} 
                                                <DeleteOutlined id={key} className='btn-filter-delete' onClick={stateDeleteHandle}/></Menu.Item>)}
                    </Menu.SubMenu>          
        </Menu>
    };

    const buildPanel = React.useCallback((filters: any, addStoreMenuFlag:boolean=false) => {
        return <Space onClick={ev => ev.stopPropagation()} wrap>
            {props.filterStored && addStoreMenuFlag?<Dropdown overlay={menuStoreFilters} placement="bottomLeft" arrow><MenuOutlined/></Dropdown>:undefined}
            {filters
                .map((c: any, index: number) => {
                    if(c.type == Space) {
                        const { children, ...otherProps } = c.props;
                        if (children) {
                            otherProps.children = createInnerItems(children);
                        }
                        otherProps.key = index;
                        return React.createElement(Space, otherProps);
                    } else if (typeof c.type != "string"  && c.type != React.Fragment) { // отсекаем не компоненты, для тегов span, div и т.д. это не нужно
                        const changeHandler =  (props.optionFilters || {})[c.key]?.debounce?changedDebounce:changed;
                        return createFilterItem(c, refs, props.initValues, changeHandler);
                    } else {
                        return React.cloneElement(c, { key: "" });
                    }
                })}
        </Space>
    }, [ refs, changed, createInnerItems,props.initValues]);

    const collapsible = otherFilters.length == 0 ? "header" : "";
    
    if(props.interface) {
        // Долговреенное сохранние фильтра с именем
        props.interface.saveFilterPreference = saveFilterPreference;
        // Загрузка и применение фильтра с именем
        props.interface.loadAndApplyFilterPreference = loadAndApplyFilterPreference;

    }


    if (primaryFilters.length === 0 && otherFilters.length === 0)
        return null
    else
        return <DesktopOrTabletScreen>
            <Collapse expandIconPosition={"right"} collapsible={collapsible ? collapsible : undefined} bordered={false}>
                {!hardRefresh ?
                    <Panel header={buildPanel(primaryFilters,true)}
                        extra={genExtra(refs)}
                        showArrow={otherFilters.length > 0}
                        className={otherFilters.length > 0 ? "pad64" : "pad0"}
                        key="filter-panel">
                        <Space className={props.classes['filter-panel']}>
                            {buildPanel(otherFilters)}
                        </Space>
                    </Panel>
                    : ""}
            </Collapse>
        </DesktopOrTabletScreen>

}

export const FilterPanelExt = withStyles(styles)(FilterPanelExtImpl)

