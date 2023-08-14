import React from 'react';
import moment from 'moment';

const DEFAULT_INIT_PROP_NAME = "defaultValue";

// stringify для moment сохраняет дату-время в формате ISO8601
// При чтении нужно преобразоваьт обратно в moment
export const transformRange=(prefval: any[])=>[moment(prefval[0]),moment(prefval[1])];

const isArrayAndNotRange = (v: any)=>{
    return Array.isArray(v) && !(v[0] instanceof moment)
}

export const getPropInitNames = (initObj: any) => {
    if (typeof initObj === "object" && initObj !== null) {
        return isArrayAndNotRange(initObj.propInitName)?initObj.propInitName
                    :initObj.propInitName ? initObj.propInitName.split(',') : [DEFAULT_INIT_PROP_NAME];
    } else {
        return [DEFAULT_INIT_PROP_NAME];
    }
}

export const getInitValues = (initObj: any) => {
    if(!initObj) return [undefined];
    // объект, но не массив
    if (typeof initObj === "object" && !(initObj instanceof Array)) {
        // исключение для moment object
        if (initObj instanceof moment) {
            return [initObj];
        }
        const propInitNames = isArrayAndNotRange(initObj.propInitName)?initObj.propInitName
                                :initObj.propInitName ? initObj.propInitName.split(',') : [DEFAULT_INIT_PROP_NAME];
        if (propInitNames.length > 1) {
            if(isArrayAndNotRange(initObj.initValue)) {
                return initObj.initValue;
            } else {
                if(initObj.initValue) {
                    const values = initObj.initValue.split(',');
                    // особенность данных с разделителем в томЮ что на 1 месте идет идентфикатор - целое число
                    // Поэтому преобразуем в целое
                    values[0] = parseInt(values[0]);
                    return values;
                } else {
                    return [undefined];
                }
            }
        } else {
            return [initObj.initValue];
        }
    } else {
        return [initObj];
    }
}

// подготовка к отправке на сервер
export const makeToServer = (config: any) => {
    let newconfig = { ...config };

    for (let key in newconfig) {
        let val: any = newconfig[key];
        // исключение с DatePicker - надо передавать timestamp
        if (moment.isMoment(val) && moment(val).isValid()) {
            newconfig[key] = val.toDate().getTime();
        } else
            // исключение с DateRange - надо передавать массив timestamp
            if (val instanceof Array && val.length == 2 &&
                moment.isMoment(val[0]) && moment(val[0]).isValid() &&
                moment.isMoment(val[1]) && moment(val[1]).isValid()) {
                newconfig[key] = [val[0].toDate().getTime(), val[1].toDate().getTime()];
            } else
                // исключение с Select в режиме multiple - надо передавать массив key (проверка на соплях)
                if (val instanceof Array && val.length > 0 &&
                    val[0] instanceof Object && (val[0].key || val[0].value)) {
                        newconfig[key] = val.map(v => parseInt(v.key || v.value))
                } else
                    // исключение для DataLookup
                    if(val instanceof Object && val.title) {
                        newconfig[key] = val.value || val.key
                    }

    }
    return newconfig;
}

// извлечение из объекта задающего начальные значения фильтра в объект
// используемый для отправки на сервер
export const extractValuesFromInitFilters = (initFilters: any, toServer=false) => {
    let values: any = {}
    if (initFilters) {
        for (let key in initFilters) {
            // на первом месте должно быть значение, которе передается на сервер
            values[key] = getInitValues(initFilters[key])[0];
        }
    }
    return !toServer ? values : makeToServer(values);
}

export const createFilterItem = (comp: any, refs: any, initValues: any, changedProc: (fvalue: any, svalue: any, tvalue?: any) => void) => {
    let options: any = {
        key: comp.key,
        onChange: (value: any) => changedProc(comp.key, value)
    }
    // исключение для DataLookup
    if (comp.type.displayName && (comp.type.displayName.indexOf("DataLookup") === 0)) {
        delete options.onChange;
        options.onSelect = (val: any, option: any) => changedProc(comp.key, option.id, option)
    }
    // исключение для DataSelect
    if (comp.type.displayName && (comp.type.displayName.indexOf("DataSelect") === 0)) {
        delete options.onChange;
        const multipleFlag = comp.type.displayName.indexOf(".multiple")>=0;
        options.onChange = (value: any, display: any) => changedProc(comp.key, value, multipleFlag?true:display)
    }

    // установка начального значения
    let initObj = initValues ? initValues[comp.key] : undefined;
    const propNames = getPropInitNames(initObj);
    const values = getInitValues(initObj);
    propNames.map((p: any, idx: number) => options[p] = values[idx]);
    // сохранение ссылки на компонент
    const ref = React.createRef();
    options.ref = ref;
    refs[options.key] = ref;

    return React.cloneElement(comp, options);
}

export const normalizeInputValue = (val: any) => {
    // искючения для checkbox. в val передается event
    if (val && typeof val === "object" && val.target && val.target.type == "checkbox") {
        return val.target.checked ? 1 : 0;
    }
        // искючения для radio. в val передается event
        if (val && typeof val === "object" && val.target && val.target.type == "radio") {
            return val.target.value;
        }
            if (val && typeof val === "object" && (val.value || val.title)) {
                return parseInt(val.value ?? 0);
            } else {
                return val;
            }
}

export const resetToInitValues = (refs: any, config: any, initValues: any) => {
    // clear config
    Object.keys(config).forEach(function (key) { delete config[key] });
    // возврат к init значениям
    for (const key in refs) {
        const initObj = initValues[key];
        const propNames = getPropInitNames(initObj);
        const values = getInitValues(initObj);
        // сбросим у компоеннтов в ref
        propNames.map((p: any, idx: number) => refs[key].current ? refs[key].current[p] = values[idx] : "");
        // на первом месте должно быть значение, которе передается на сервер
        config[key] = values[0];
    }
}
