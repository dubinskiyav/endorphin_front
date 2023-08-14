import React, {CSSProperties} from 'react';
import { AutoComplete, Input, Button } from 'antd';
import { EllipsisOutlined, SearchOutlined, MailOutlined } from '@ant-design/icons';
import { MSG_REQUEST_ERROR, DEBOUNCE_TIMEOUT } from './Const';
import { notification } from 'antd';
import requestToAPI from "./Request";
import { debounce, groupBy } from "./Utils";
import { chooseSubject } from "./stddialogs/SubjectDialog";
import { chooseSGood } from './stddialogs/SGoodDialog';
import withStyles, {WithStylesProps} from "react-jss";




const convertFromResponse = (resp: any, renderTitleGroup: ((item:any) => JSX.Element) | undefined,
                             renderItem: (item: any) => any) => {
    if (renderTitleGroup) {
        // группируем по parentId
        const grouped = groupBy(resp, "parentId");
        let result = Object.keys(grouped).map(k => {
            const item0 = grouped[k][0];
            return {
                label: renderTitleGroup(item0),
                options: grouped[k].map((g: any) => renderItem(g))
            };
        })
        return result;
    } else {
        return resp.map((g: any) => renderItem(g));
    }
}

const getRandomInt = (max: number) => {
    return Math.floor(Math.random() * max);
}

let refreshDataHandle = 0;

// JSS. Стили компонента
const styles = {
    'lookup-button-dict': {
        borderLeftColor: 'transparent'
    }
}



interface DataLookupProps extends WithStylesProps<typeof styles> {
    uri: string,
    renderItem: (item: any) => any,
    renderGroup?: (item: any) => JSX.Element,
    allowClear?: boolean,
    defaultValue?: any,
    minLengthSeachString?: number,
    interface?: any,
    style?: CSSProperties,
    placeholder?: string,
    onChange?: (value: any) => void,
    onDictonaryClick?: (fvalue: (fvalue: boolean, svalue: any) => void) => void,
    params?: any,
    [key: string]: any
}



const DataLookup = React.forwardRef<any, DataLookupProps>((props, ref) => {
    const { uri, defaultValue, placeholder, onChange, style = { width: "100%" }, minLengthSeachString = 3,
        onDictonaryClick, renderItem, renderGroup, classes, params, ...otherprops } = props;

    const [data, setData] = React.useState<any[] | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [dropDownFlag, setDropDownFlag] = React.useState(false);
    const inputRef = React.useRef<any>(null);
    const [value, setValue] = React.useState<any>({});

    const refreshData = React.useCallback((val: any, handle?: any) => {
        setLoading(true);
        requestToAPI.post(props.uri, { search: val, ...params })
            .then(response => {
                if (handle && handle !== refreshDataHandle) return;
                setLoading(false);
                setData(convertFromResponse(response, renderGroup, renderItem));
            })
            .catch(error => {
                if (handle && handle !== refreshDataHandle) return;
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

    const handleRefresh = () => {
        if (value && value.title) {
            refreshData(value.title);
        }
    }

    // это нужно сделать, чтобы debounce не создавал на каждый введенный символ новую функцию
    const [debounceHelper] = React.useState({ func: debounce(refreshData, DEBOUNCE_TIMEOUT) });
    const debounceRefreshData = debounceHelper.func;

    const handleSearch = (value: string) => {
        if (value && value.length > minLengthSeachString) {
            refreshDataHandle = getRandomInt(Number.MAX_SAFE_INTEGER);
            debounceRefreshData(value, refreshDataHandle);
        }
    };

    if (props.value && props.value.value && !data) {
        setData([{
            id: props.value.value,
            key: props.value.value,
            value: props.value.title,
            label: <div><span>{props.value.title}</span></div>
        }]);
    }

    const handleChange = React.useCallback((val: any, options: any) => {
        setDropDownFlag(false);
        if (props.onSelect) {
            props.onSelect(val, options);
        }
    }, [props])

    const handleDictonaryClick = React.useCallback((ev: any) => {
        setDropDownFlag(false);
        if (onDictonaryClick) {
            onDictonaryClick((okFlag, selectValueObject) => {
                if (inputRef?.current) {
                    inputRef.current.focus({
                        cursor: 'end',
                    });
                }
                if (okFlag) {
                    const opt = renderItem(selectValueObject);
                    setData([opt]);
                    setValue({ value: opt.id, title: opt.value, additional: opt.additional });
                    handleChange(opt.value, opt);
                }
            });
        }
        ev.stopPropagation(); // TODO не работает, разобраться
    }, [onDictonaryClick, renderItem, onChange]);

    const originalHandleChange = (val: any, options: any) => {
        if (!options) options = {};
        // реакция на нажатие clear
        if(val===undefined) {
            if (props.onSelect) {
                props.onSelect(val, options);
            }
        } else {
            setDropDownFlag(true);
        }
        if (onChange) {
            onChange({ value: options.id, title: options.value ?? val, additional: options.additional });
        } else {
            setValue({ value: options.id, title: options.value ?? val, additional: options.additional });
        }
    }

    const handleKeyDown = (ev: any) => {
        if (ev.keyCode >= 37 && ev.keyCode <= 40) {
            if (ev.ctrlKey && !ev.shiftKey) {
                handleDictonaryClick(ev);
            } else {
                if (ev.keyCode == 38 || ev.keyCode == 40) {
                    setDropDownFlag(true);
                }
            }
        };
        if (ev.keyCode == 27) {
            setDropDownFlag(false);
            ev.preventDefault();
        }
        if (ev.keyCode == 13) {
            if (dropDownFlag) {
                setDropDownFlag(false);
                ev.stopPropagation();
            }
        }

    }

    const extractDefaultValue = ()=>{
        if(defaultValue) {
            return defaultValue.title;
        }
        return (props.value && data && data.length > 0) ? data[0].value : undefined;
    }

    // interface содержит методы, которые можно применять к функциональному компоненту
    // в стиле компонента, построенного на классах
    if (props.interface) {
        props.interface.search=handleSearch;
        props.interface.refresh=refreshData;
        props.interface.doDropDown=setDropDownFlag;
        props.interface.getValue=()=>value;
    }

    return <AutoComplete
        open={dropDownFlag}
        ref={ref}
        options={data || []}
        onSearch={handleSearch}
        defaultValue={extractDefaultValue()}
        onChange={originalHandleChange}
        onBlur={() => setDropDownFlag(false)}
        onKeyDown={handleKeyDown}
        notFoundContent="Данные не найдены. Уточните поиск"
        style={{ ...style }}
        {...otherprops}
        value={value && Object.keys(value).length != 0 ? value.title : undefined}
        onSelect={(val: any, option: any) => handleChange(val, option)}
        defaultActiveFirstOption={true}
    >
        <Input.Search ref={inputRef} className="lookup"
            enterButton={<Button tabIndex={-1} icon={<SearchOutlined />} disabled
                style={props.disabled ? {} : { cursor: "default", backgroundColor: "white" }} />}
            addonAfter={onDictonaryClick ? <Button tabIndex={-1} className={classes && classes["lookup-button-dict"]}
                onClick={handleDictonaryClick} icon={<EllipsisOutlined />} disabled={props.disabled} /> : undefined}
            onSearch={handleRefresh}
            placeholder={placeholder}
            loading={loading} />
    </AutoComplete>
}) as unknown as CompoundedComponent


DataLookup.displayName = 'DataLookup';


interface CompoundedComponent extends React.ForwardRefExoticComponent<DataLookupProps> {
    Subject: any,
    ProgUser: any,
    Company: any,
    SGood: any,
    Address: any,
    Town: any
}

interface SubjectProps extends WithStylesProps<typeof styles> {

}

DataLookup.Subject = React.forwardRef<any, SubjectProps>((props, ref) => {
    const renderTitleGroup = (item: any): JSX.Element => {
        return <span>{item.parentName}</span>
    }


    const renderItem = (item: any) => {
        return {
            id: item.subjectId,
            key: item.subjectId,
            value: item.subjectName,
            label: <div><span>{item.subjectName}</span></div>
        }
    }

    return <DataLookup ref={ref} uri={"refbooks/subject/subject/find"}
        renderItem={renderItem}
        renderGroup={renderTitleGroup}
        onDictonaryClick={chooseSubject}
        className="ant-select-dict"
        {...props} />
});

DataLookup.Subject.displayName = 'DataLookup.Subject';

interface ProgUserProps extends WithStylesProps<typeof styles> {

}
DataLookup.ProgUser = React.forwardRef<any, ProgUserProps>((props, ref) => {
    const renderTitleGroup = (item:any): JSX.Element => {
        return <span>{item.statusDisplay}</span>
    }

    const renderItem = (item: any) => {
        return {
            id: item.proguserId,
            key: item.proguserId,
            value: item.proguserName,
            label:
                <div>
                    <div>{item.proguserName} [{item.proguserFullname}]</div>
                    {item.proguserchannelAddress ?
                        <a href={"mailto:" + item.proguserchannelAddress}><div><MailOutlined /> {item.proguserchannelAddress}</div></a> :
                        <div><MailOutlined /> - </div>}
                </div>
        }
    }

    return <DataLookup ref={ref} uri={"admin/credential/proguser/find"}
        renderItem={renderItem}
        renderGroup={renderTitleGroup}
        {...props} />
});

DataLookup.ProgUser.displayName = 'DataLookup.ProgUser';

interface CompanyProps extends WithStylesProps<typeof styles> {

}
DataLookup.Company = React.forwardRef<any, CompanyProps>((props, ref) => {

    const renderItem = (item: any) => {
        return {
            id: item.companyId,
            key: item.companyId,
            value: item.companyName,
            label: <div><span>{item.companyName}</span></div>
        }
    }

    return <DataLookup ref={ref} uri={"refbooks/company/company/find"}
        renderItem={renderItem}
        {...props} />
});

DataLookup.Company.displayName = 'DataLookup.Company';

interface SGoodProps extends WithStylesProps<typeof styles> {

}
DataLookup.SGood = React.forwardRef<any, SGoodProps>((props, ref) => {

    const renderItem = (item: any) => {
        return {
            id: item.sgoodId,
            key: item.sgoodId,
            value: item.sgoodCode + " " + item.sgoodName,
            label: <div>{item.sgoodCode} {item.sgoodName}</div>
        }
    }

    return <DataLookup ref={ref} uri={"refbooks/sgood/sgood/find"}
        renderItem={renderItem}
        onDictonaryClick={chooseSGood}
        className="ant-select-dict"
        {...props} />
});

DataLookup.SGood.displayName = 'DataLookup.SGood';

interface AddressProps extends WithStylesProps<typeof styles> {

}
DataLookup.Address = React.forwardRef<any, AddressProps>((props, ref) => {

    const renderItem = (item: any) => {
        return {
            id: item.addressId,
            key: item.addressId,
            value: item.fullAddress,
            label: <div><span>{item.fullAddress}</span></div>
        }
    }

    return <DataLookup ref={ref} uri={"refbooks/address/address/find"}
        renderItem={renderItem}
        {...props} />
});

DataLookup.Address.displayName = 'DataLookup.Address';

DataLookup.SGood.displayName = 'DataLookup.SGood';

interface TownProps extends WithStylesProps<typeof styles> {

}
DataLookup.Town = React.forwardRef<any, TownProps>((props, ref) => {

    const renderItem = (item: any) => {
        return {
            id: item.townId,
            key: item.townId,
            value: `${item.townName}, ${item.towntypeCode} (${item.townCode})`,
            label: <div>
                        <div>{item.townName}, {item.towntypeCode}</div>
                        <div>{item.countryName}</div>
                        <div>{item.townIndex}</div>
                   </div>
        }
    }

    return <DataLookup ref={ref} uri={"refbooks/town/town/find"}
        renderItem={renderItem}
        {...props} />
});

DataLookup.Town.displayName = 'DataLookup.Town';

export default withStyles(styles)(DataLookup)
