import React, {ReactNode} from 'react';
import { Button, notification, Tooltip } from 'antd';
import { CheckOutlined, PlusOutlined, DeleteOutlined, SyncOutlined, FilterOutlined } from '@ant-design/icons';
import moment from 'moment';
import { DEFAULT_DATE_FORMAT, DEFAULT_DATETIME_FORMAT, MSG_REQUEST_ERROR } from "./Const";
import Status from "./Status";
import requestToAPI from './Request';
import {isMobile} from './Responsive'
import {createUseStyles, jss, WithStylesProps} from "react-jss";

export const buildSortByDefaultFromColumns = (columns: any[]) => {
    if (!columns) return
    return columns
        .filter(c => c.sorter && c.defaultSortOrder)
        .map(c => { return { field: c.dataIndex, order: c.defaultSortOrder } });
}

// const useStyles = createUseStyles({
//     cellContentCentered:{
//         display: 'flex',
//         justifyContent: 'center'
//     },
// })
const stylesDrawIcon = {
    cellContentCentered:{
        display: 'flex',
        justifyContent: 'center'
    },
    statusDiv: {
        width: '16px',
        height: '16px'
    }
}

export const DrawBoolIcon = (data: any, _record: any, _index: number, value: any): JSX.Element | string => {
    const {classes} = jss.createStyleSheet(stylesDrawIcon).attach()
    if (value !== undefined) {
        return data === value ? <div className={classes.cellContentCentered}><CheckOutlined /></div> : "";
    } else {
        return data ? <div className={classes.cellContentCentered}><CheckOutlined /></div> : "";
    }
};


export const drawDate = (data: any) => data ? moment(data).format(DEFAULT_DATE_FORMAT) : "";
export const drawDateAndTime = (data: any) => data ? moment(data).format(DEFAULT_DATETIME_FORMAT) : "";

export const drawStatus = (color: any, record: any) => {
    if (typeof (color) !== "number" && record) {
        color = record.documentTransitColor
    }

    const {classes} = jss.createStyleSheet(stylesDrawIcon).attach()
    return typeof (color) === "number" ? (
        <div className={classes.cellContentCentered}>
            <Tooltip title={record ? record.documentTransitName : ""} mouseLeaveDelay={0}>
                <div className={classes.statusDiv}>
                    <Status color={"#" + (+color).toString(16).padStart(6, '0')} />
                </div>
            </Tooltip>
        </div >
    ) : "";
}

export const drawFloat = (data: any) => data ? parseInt(data).toLocaleString() + data.toFixed(2).slice(data.toFixed(2).indexOf('.')) : "";

export const intFlagFromCheckboxEvent = (event: any) => event.target.checked ? 1 : 0;

export const buildSortFromColumns = (sorts: any) => {
    if (!(sorts instanceof Array)) sorts = [sorts];
    // сортируем по column.sorter.multiple
    return sorts
        .filter((c: any) => { return c.column && c.column.sortOrder !== null })
        .sort((c1: any, c2: any) => c1.column.sorter.multiple - c2.column.sorter.multiple)
        .map((c: any) => { return { field: c.field, order: c.order } });
}

export const rebuildColumns = (columns: any[]) => {
    columns.filter((c: any) => c.sorter)
        .forEach((c: any, idx: number) => {
            let compare;
            if (typeof c.sorter === 'function') {
                compare = c.sorter;
            } else if (c.sorter && c.sorter.compare) {
                compare = c.sorter.compare;
            }
            c.sorter = {
                multiple: idx
            }
            if (compare) {
                c.sorter.compare = compare;
            }
        });
}


export const resetSortColumns = (columns: any[]) => {
    columns.filter((c: any) => c.sorter)
        .forEach((c: any, _idx: number) => {
            c.sortOrder = null;
        });
}


export const parseCalId = (calId: number | string) => {
    const scal = "" + calId;
    return {
        year: parseInt(scal.substring(0, 4)),
        month: parseInt(scal.substring(4, 6)) - 1, // zero based
        day: parseInt(scal.substring(6, 9))
    }
}

export const converToCalId = (moment: any) => {
    return moment ? '' + moment.year() + moment.format("MM") + moment.format("DD") : undefined;
}

export const assignArrayOfObject = (array: any[]) => {
    return Array.from(array, v => Object.assign({}, v))
}

const crypto = require('crypto');

export const generateHash = (data: string) => {
    return crypto.createHmac('sha256', "xxx")
        .update(data)
        .digest('hex');
}

export const debounce = (func: (...params: any[]) => any, wait: number, immediate?: boolean) => {
    var timeout: ReturnType<typeof setTimeout> | null = null;
    return function executedFunction(this: any, ...args: any[]) {
        const context = this;
        const later = function () {
            if (!immediate) func.apply(context, args);
        };

        const callNow = immediate && !timeout;

        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }

        timeout = setTimeout(later, wait);

        if (callNow) func.apply(context, args);
    };
}

export const groupBy = (items: any[], key: string) => {
    return items.reduce((groups, curr) => {
        let g = groups[curr[key]];
        if (!g) {
            g = [curr];
            groups[curr[key]] = g;
        } else {
            g.push(curr);
        }
        return groups;
    }, {});
}

export const buildURL = (contour: any, module: any, entity: string) => {
    return (contour.name ? contour.name.toLowerCase() + "/" : "") +
        (module.name ? module.name.toLowerCase() + "/" : "") +
        entity.toLowerCase();
}

export const genDefParamsForGetAllList = (name: string) => {
    return {
        "pagination": {
            "current": 1,
            "pageSize": -1
        },
        "sort": [
            {
                "field": name,
                "order": "ascend"
            }
        ]
    }
}

// создание кнопок с icon для мобильной версии
export const buildMobileButtons = (buttons: ReactNode[] | undefined, modal = false) => {
    if (!buttons) return;
    const className = modal ? "mobile-menu-button-color" : "";

    const mobFlag = isMobile();

    let mobilebtns = buttons.map((b: any) => {
        let icon = b?.props?.icon;
        // icon для стандартных кнопок
        if (!icon) {
            switch (b.key) {
                case "add":
                    icon = <PlusOutlined />;
                    break;
                case "del":
                    icon = <DeleteOutlined />
                    break;
                case "refresh":
                    icon = <SyncOutlined />
                    break;
                case "filter":
                    icon = <FilterOutlined />
                    break;
                default:
                    break;
            }
        }
        if (icon) {
            if (b.key == "more") {
                return React.cloneElement(b, { key: b.key, className: mobFlag?"more-menu-button-mobile":"more-menu-button" });
            }
            if (b.key == "filter") {
                return React.cloneElement(b, { key: b.key });
            }
            return <Button disabled={b.props.disabled} onClick={b.props.onClick} key={b.key} icon={icon} className={"mobile-menu-button " + className} />
        } else {
            return <Button disabled={b.props.disabled} onClick={b.props.onClick} key={b.key} className={"mobile-menu-button " + className + " text_menu_button"}>{b.props.children}</Button>
        }
    });

    return <div>{mobilebtns}</div>;
}

export const setItemInLocalStorage = (key: string, value: string) => {
    localStorage.setItem(key + "?" + (sessionStorage.getItem("user.login") ?? localStorage.getItem("user.login")), value);
}

export const getItemFromLocalStorage = (key: string): any => {
    return localStorage.getItem(key + "?" + (sessionStorage.getItem("user.login") ?? localStorage.getItem("user.login")));
}

const capClassTypeList: any = {};

export const getCapClassTypeName = (capClassTypeId: any) => {
    if (Object.keys(capClassTypeList).length === 0) {
        const list = JSON.parse(getItemFromLocalStorage("capClassTypeList")) ?? [];
        list.forEach((value: any) => capClassTypeList[value.capClassTypeId] = value.capClassTypeName);
    }

    return capClassTypeList[capClassTypeId] ?? "";
}

export const refreshStatusList = (callback: (value: any) => void) => {

    requestToAPI.post("system/document/getstatuslist")
        .then(response => {
            setItemInLocalStorage("documentTransit", JSON.stringify(response));
            if (callback) callback(response);
        })
        .catch((error) => {
            notification.error({
                message: MSG_REQUEST_ERROR,
                description: error.message
            })
        })
}

const getValue = (value: any, field: string | number) => {
    return value[field] ?? ((value && value.record) ? value.record[field] : undefined);
}

export const getSumField = (data: any[], field: string | number) => {
    let sum = data.length > 0 ? 0 : undefined;
    data.forEach((value: any) => sum += getValue(value, field) ?? 0);
    return sum;
};

export const getScalarSumField = (data: any[], fieldA: string | number, fieldB: string | number) => {
    if (data.length > 0) {
        let sum = 0
        data.forEach(value => sum += (getValue(value, fieldA) ?? 0) * (getValue(value, fieldB) ?? 0));
        return sum;
    }
}

export function isPlainObject(input: any){
    return input && !Array.isArray(input) && typeof input === 'object';
}

export const prettySizeOf = function (bytes: number) {
    if (bytes == 0) { return "0.00 B"; }
    var e = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes/Math.pow(1024, e)).toFixed(2)+' '+' KMGTP'.charAt(e)+'B';
}

export const useActiveElement = () => {
    const [active, setActive] = React.useState(document.activeElement);

    const handleFocusIn = (e: any) => {
        setActive(document.activeElement);
    }

    React.useEffect(() => {
        document.addEventListener('focusin', handleFocusIn)
        return () => {
            document.removeEventListener('focusin', handleFocusIn)
        };
    }, [])

    return active;
}

export function deepClone(obj: any, hash = new WeakMap()): any {
    if (Object(obj) !== obj) return obj; // primitives
    if (hash.has(obj)) return hash.get(obj); // cyclic reference
    const result: any = obj instanceof Set ? new Set(obj) // See note about this!
                : obj instanceof Map ? new Map(Array.from(obj, ([key, val]) =>
                [key, deepClone(val, hash)]))
                : obj instanceof Date ? new Date(obj)
                : obj instanceof RegExp ? new RegExp(obj.source, obj.flags)
                    : moment.isMoment(obj) ? obj.clone()
                        : obj.constructor ? new obj.constructor()
                            : Object.create(null);
    hash.set(obj, result);
    return Object.assign(result, ...Object.keys(obj).map(
        key => ({ [key]: deepClone(obj[key], hash) }) ));
}

// (c) https://stackoverflow.com/users/118125/martin-delille
export function invertColor(hex: string, bw: boolean) {
    if (hex.indexOf('#') === 0) {
        hex = hex.slice(1);
    }
    // convert 3-digit hex to 6-digits.
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) {
        throw new Error('Invalid HEX color.');
    }
    var r = parseInt(hex.slice(0, 2), 16),
        g = parseInt(hex.slice(2, 4), 16),
        b = parseInt(hex.slice(4, 6), 16);
    if (bw) {
        // https://stackoverflow.com/a/3943023/112731
        return (r * 0.299 + g * 0.587 + b * 0.114) > 186
            ? '#000000'
            : '#FFFFFF';
    }
    // invert color components
    var new_r = (255 - r).toString(16),
        new_g = (255 - g).toString(16),
        new_b = (255 - b).toString(16);
    // pad each with zeros and return
    return "#" + new_r.padStart(2, '0') + new_g.padStart(2, '0') + new_b.padStart(2, '0');
}

export const componentAsText= (comp: any)=>{
    const enumChildren = (comp:any, func: (value: string) => void)=>{
        React.Children.map((comp.children || comp.props.children), c => {
            if(typeof c==="string") {
                func(c)
            } else {
                enumChildren(c,func)
            }
        });
    }
    let text="";
    enumChildren(comp,(s: string)=>{text+=s+" "});
    return text.trim();
}

export const smartEllipsis =(s:string, maxLength:number)=>{
    if (!s) return s;
    if (maxLength < 1) return s;
    if (s.length <= maxLength) return s;
    if (maxLength == 1) return s.substring(0,1) + '...';

    var midpoint = Math.ceil(s.length / 2);
    var toremove = s.length - maxLength;
    var lstrip = Math.ceil(toremove/2);
    var rstrip = toremove - lstrip;
    return s.substring(0, midpoint-lstrip) + '...'
           + s.substring(midpoint+rstrip);
}

// hook для условного рендеринга, позволяет перемонтировать, а не просто обновить компонент
// Пример использования
/*
    const [myState, setMyState] = useState();
    const update = useUpdateOnChange(myState);
    return (
    <div>
      ... ...
      {update && <MyComponent />}
    </div>
  );
*/

export const useUpdateOnChange = (change:any) => {
    const [update, setUpdate] = React.useState(false);
  
    React.useEffect(() => {
      setUpdate(!update);
    }, [change]);
  
    React.useEffect(() => {
      if (!update) setUpdate(true);
    }, [update]);
  
    return update;
  };

  /**
   * Разбор строки distinguished name
   * @param value 
   */
export const parseDN = (value:string)=>{
    const result:any = {};
    const regex = /(?:^|,\s?)(?:(?<name>[A-Za-zЁёА-я]+)=(?<val>"(?:[^"]|"")+"|[^,]+))+/gi
    let match;
    while ((match = regex.exec(value)) != null) {
        if (match.index === regex.lastIndex) {
        ++regex.lastIndex;
        }
        if(match?.groups?.name) {
            const key = match.groups.name;
            const val = match?.groups?.val;
            if(result[key]) {
                result[key].push(val)
            } else {
                result[key]=[val]
            }            
        }
    }
    return result;
}
