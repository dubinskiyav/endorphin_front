import React, {FC} from 'react';
import { Table, Tag, notification, Menu, Popover } from 'antd';
import { ExportOutlined, CopyOutlined, MoreOutlined,
    CloseCircleOutlined,
    CaretUpOutlined,CaretDownOutlined } from '@ant-design/icons';
import requestToAPI from "./Request";
import {
    buildSortByDefaultFromColumns, buildSortFromColumns,
    rebuildColumns, resetSortColumns
} from "./Utils";
import { confirm, inputValue } from "./Dialogs";
import { format } from 'react-string-format';
import {
    MSG_CONFIRM_DELETE, MSG_REQUEST_ERROR, MSG_DELETE_ERROR,
    MSG_DELETE_SUCCESS, MSG_SUCCESS_COPY_TO_CLIPBOARD,
    MSG_NO_SECURITY
} from "./Const";
import { getLoginButton } from "./LoginForm";
import { showPropertyDialog } from "./stddialogs/PropertyDialog"
import { exportJsonToCVS, exportJsonToExcel } from "./ExportUtils"
import { useHistory } from "react-router-dom";
import { extractValuesFromInitFilters } from './FilterUtils'
import { isMobile } from './Responsive';
import DocStatusCenter from "./DocStatusCenter";
import {drawDate,drawDateAndTime,isPlainObject} from './Utils';
import ColumnDialogMobile from './stddialogs/ColumnDialogMobile';
import {objectWithAnyFields, QfiltersItemType} from "./types";
import withStyles, {WithStylesProps} from "react-jss";
import { PRIMARY_COLOR_DARK } from './StyleConst';

const { SubMenu } = Menu;

export const ColumnTypes = {
    INTEGER:1,
    FLOAT:2,
    STRING:3,
    DATE:4,
    DATETIME:5
}

// кол-во записей на страницу, по умолчанию
const DEFAULT_PAGE_SIZE = 10

const SORT_DIRECTIONS: string[] = ['ascend', 'descend']

const FILTER_TAG_LIKE = 'like';
const FILTER_TAG_EQ = 'eq';
const FILTER_TAG_NEQ = 'neq';
const FILTER_TAG_ISNULL = 'isnull';

export const nextSortDirection = (current: string) => {
    if (!current) {
        return SORT_DIRECTIONS[0];
    }
    return SORT_DIRECTIONS[SORT_DIRECTIONS.indexOf(current) + 1];
}

const getTableTD = (elem: any) => {
    while (elem.nodeName.toUpperCase() != "TD") {
        elem = elem.parentNode;
    }
    return elem;
}

const shortOrderString=(s: string)=>(s=="ascend"?"asc":s=="descend"?"desc":"unknow");

const buildGraphQLOrderBy=(fields: string, order: string)=>{
    let curr: objectWithAnyFields = {};
    const result = curr;
    fields.split(".").forEach((fcomp, idx, afields)=>{
        if(idx<afields.length-1) {
            curr[fcomp] = {};
            curr = curr[fcomp];
        } else {
            curr[fcomp] = shortOrderString(order);
        }
    });
    return result;
}
const buildGraphQLWhere=(fields: string, value: any)=>{
    let curr: objectWithAnyFields = {};
    const result = curr;
    fields.split(".").forEach((fcomp, idx, afields)=>{
        if(idx<afields.length-1) {
            curr[fcomp] = {};
            curr = curr[fcomp];
        } else {
            curr[fcomp] = fcomp!=FILTER_TAG_LIKE?value:"%"+value+"%";
        }
    });
    return result;
}

const buildGraphQLFromParams=(params: objectWithAnyFields)=>{ // eslint-disable-line
    const graphQLValues = {
        "order_by":{},
        "where":{},
        "offset":(params.pagination.current-1)*params.pagination.pageSize,
        "limit": params.pagination.pageSize,
    }
    // сортировка
    let orderBy =  {};
    params.sort.forEach((s: any) => {
        orderBy =  {...orderBy,...buildGraphQLOrderBy(s.field,s.order)}
    })
    graphQLValues.order_by = orderBy;

    // фильтры
    const graphQLFilters = [];
    if(params.search) {
        graphQLFilters.push({"allText":{[FILTER_TAG_LIKE]:"%"+params.search+"%"}})
    }
    Object.keys(params.filters).forEach(key=>{
        // добавляем в where только быстрые фильтры
        if(key.startsWith("quick.")) {
            graphQLFilters.push(
                buildGraphQLWhere(key.split(".").slice(1).join("."),params.filters[key])
            );
        } else {
            //если есть именованные фильтры
            const val = params.filters[key];
            if(val===undefined) return;
            // интервал задается объектом {_gte: 1, _lte: 5} поэотму его пропускаем
            if(!isPlainObject(val)) {
                const op = (val instanceof Array)?"_in":"_eq";
                // пустые массивы не добавляем
                if(op=="_in" && val.length==0) return;
                key = key+"."+op;
            }
            graphQLFilters.push(
                buildGraphQLWhere(key,val)
            );

        };
    })
    if(graphQLFilters.length>0) {
        let where: any = {...graphQLFilters[0]};
        where["_and"]=graphQLFilters.splice(1);
        graphQLValues.where=where;
    }

    return graphQLValues;
}

interface PropertyesPopupMenuProps {
    record: any,
    columns: any[],
    visible: boolean,
    x: number,
    y: number,
    selectInterface: any,
    setPopupState: (value: any) => void,
    tableInterface: objectWithAnyFields,
    statuses?: any,
    selectable?: boolean
}

const PropertyesPopupMenu: FC<PropertyesPopupMenuProps> = ({ record, columns, visible, x, y, tableInterface, statuses, selectable }) => {
    return (
        visible
            ? <div className="ant-popover ant-popover-inner" style={{ left: `${x}px`, top: `${y}px`, position: "fixed" }}>
                <Menu>
                    {statuses &&
                        <DocStatusCenter
                            selectedRecords={tableInterface.getSelectedRecords().length === 0 ? [record] : tableInterface.getSelectedRecords()}
                            idName={tableInterface.getProperties().props.idName}
                            {...statuses} />
                    }
                    <SubMenu key={3} icon={<CopyOutlined />} title="Копировать">
                        <Menu.Item key='3.1' onClick={() => { copyRecords([record], columns) }}>Текущую запись</Menu.Item>
                        {selectable?
                            <Menu.Item key='3.2' disabled={tableInterface.getSelectedRecords().length==0} onClick={() => { copyRecords(tableInterface.getSelectedRecords(), columns) }}>Отмеченные записи</Menu.Item>
                            :undefined
                        }
                    </SubMenu>
                    <SubMenu key={2} icon={<ExportOutlined />} title="Экспорт">
                        <Menu.Item key="2.1" onClick={() => { tableInterface.exportData(1) }}>Экспорт в CSV</Menu.Item>
                        <Menu.Item key="2.2" onClick={() => { tableInterface.exportData(2) }}>Экспорт в Excel</Menu.Item>
                    </SubMenu>
                    <Menu.Divider />
                    <Menu.Item key={1} onClick={() => { showPropertyDialog(record, columns, tableInterface) }}>Свойства...</Menu.Item>
                </Menu>
            </div>
            : null
    )
}


function copyRecords(records: any[], columns: any[]) {
    if(!window.isSecureContext) {
        notification.error({
            message: MSG_NO_SECURITY
        })
    } else {
        if (records.length > 0) {
            let fields = columns
                .filter(c => !c.serv)
                .map(c => c.dataIndex)
            const sbuf = records
                .map(r => fields.map(k => r[k]).join(" "))
                .join("\r\n");
            navigator.clipboard.writeText(sbuf).then(function () {
                notification.success({
                    message: format(MSG_SUCCESS_COPY_TO_CLIPBOARD, records.length)
                })
            });
        }
    }
}

function checkHiddenColumns(columns: any[]) {
    if (!isMobile()) return [];
    return columns.filter(c => c.responsive && c.responsive[0] == 'md');
}

const expandedTableColumns: objectWithAnyFields[] = [
    {
        title: "Сорт",
        dataIndex: "sortIndicator",
        width: '41px',
        render: (data: any, record: any) => {
            return <span className="ant-table-column-sorter-inner" style={{marginLeft: "3px"}}>
                {record.order?
                    <>
                        <CaretUpOutlined className={"ant-table-column-sorter-up"+(record.order=="ascend"?" active":"")}/>
                        <CaretDownOutlined  className={"ant-table-column-sorter-down"+(record.order=="descend"?" active":"")}/>
                    </>
                    :""
                }
            </span>
        }
    },
    { title: "Колонка", dataIndex: "columnName", width: '30%', ellipsis: true },
    {
        title: "Значение",
        dataIndex: "value",
        ellipsis: true,
        render: (data: any, record: any) => {
            const originalRecord = record.record;
            return record.render ? record.render(record.value, originalRecord) : data;
        }
    }
];

const LONG_TOUCH_DURATION = 1000;

// JSS. Стили компонента
const styles = {
    'mod-main-table':{
        height: "calc(100% - 50px)",
    },
    'row-menu-button': {
        display: 'table-cell',
        verticalAlign: 'middle',
        width: '40px',
        height: '40px',
        backgroundColor: 'transparent',
        textAlign: 'center',
        borderRadius: '20px',
        '&:hover': {
            backgroundColor: PRIMARY_COLOR_DARK
        }
    },
    'filter-panel-close-btn': {
        float: 'right',
        marginRight: '8px',
        color: '#096dd9'
    }

}



interface DataTableProps extends WithStylesProps<typeof styles> {
    editable?: boolean,
    selectable?: boolean,
    selectType?: string,
    uri: objectWithAnyFields,
    editCallBack?: (value: any) => void,
    defaultFilters?: objectWithAnyFields,
    autoRefresh?: boolean,
    interface?: objectWithAnyFields,
    onBeforeRefresh?: (value: any) => any,
    onAfterRefresh?: (value: any) => void,
    onAfterDelete?: () => void,
    updateRecords?: any[],
    idName?: string,
    defaultSelectRows?: boolean,
    transformerQuickFilters?: (fvalue: any, svalue: any) => any,
    transformerData?: (value: any) => void,
    exportNameFile?: string,
    quickFilterResetButtonVisible?: boolean,
    getRowClass?: (value: any) => any,
    statuses?: any,
    columns: any[],
    recordMenu?: (value: any) => any,
    onSelectedChange?: (value: any) => void,
    className?: string,
    // All other props
    [x:string]: any
}

const DataTable = React.forwardRef<any, DataTableProps>(({editable = true, autoRefresh = true,
                                        selectable = true, selectType = "checkbox",
                                        updateRecords = [], idName = "id", classes, className,
                                        defaultSelectRows = false, quickFilterResetButtonVisible = false,
                                        ...props}, ref) => {
    const refOuter = React.useRef<any>(null);
    let [data, setData] = React.useState<any[] | null>(null);
    let [loading, setLoading] = React.useState(false);
    let [selectRows, setSelectRows] = React.useState<any>([]);
    let [requestParams] = React.useState<any>({
        // параметры запроса по умолчанию
        pagination: { current: 1, pageSize: props?.pagination?.defaultPageSize ?? DEFAULT_PAGE_SIZE, showSizeChanger: true },
        sort: buildSortByDefaultFromColumns(props.columns) || {},
        filters: props.defaultFilters ? extractValuesFromInitFilters(props.defaultFilters, true) : {},
    });
    const [lastSearchAndFilterState] = React.useState<any>({});
    const [filterColumns] = React.useState<any>({});
    const [contextParams] = React.useState<objectWithAnyFields>({});
    const { columns,transformerQuickFilters, ...otherProps } = props;
    const [popupState, setPopupState] = React.useState<any>({
        visible: false,
        x: 0,
        y: 0,
        statuses: props.statuses
    });
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    const [hiddenColumns] = React.useState<any[]>(checkHiddenColumns(columns));

    if(props.initFilters) {
        console.error("initFilters props found in DataTable. Use defaultFilters instead. ")
    }

    const handleHeaderClick = React.useCallback((ev: any, htmlCol: any) => {
        // Единственный способ поиска колонки htmlCol.textContent
        const column = columns?.find(c=>{
            //titleText - заменяющее свойтсво c.title, если он является компонентом
            const columnTitle = typeof c.title =="string"?c.title:c.titleText;
            return columnTitle==htmlCol.textContent;
        });
        const nextOrderDir = nextSortDirection(column.sortOrder);
        if (!ev.ctrlKey) {
            resetSortColumns(columns);
        }
        column.sortOrder = nextOrderDir;
    }, [columns]);

    const history = useHistory();

    rebuildColumns(columns);

    const dlginterface: objectWithAnyFields = {};

    // для раскрывающиеся колонки в мобильном варианте
    const renderExpandRowForMobile = (record: any, index: number, indent: any, expanded: boolean) => {
        if (expanded) {
            const data = hiddenColumns.map(c => {
                const data = {
                    columnName: c.title,
                    value: record[c.dataIndex],
                    render: c.render,
                    record:record,
                    order:c.sortOrder
                };
                return data;
            });

            const onLongTouch = (column: any, value: any)=>{
                if(!column.disableQuickFilter) {
                    dlginterface.showModal(column,value);
                }
            }
            const handleSort=(column: any)=>{
                if(!column.sorter) return;

                const nextOrderDir = nextSortDirection(column.sortOrder);
                resetSortColumns(columns);
                column.sortOrder = nextOrderDir?nextOrderDir:null;
                // колонку нужно превратить в структуру sorder.
                // Внимание! Всегда одна колонка, так как resetSortColumns
                requestParams.sort = buildSortFromColumns({column:column,field:column.dataIndex,order:column.sortOrder});
                refreshData();

                dlginterface.close();
            }
            const handleFilter=(column: any, filter: string, value: any)=>{
                if(filter=="like") {
                    inputValue(`Быстрый фильтр по полю "${column.title}"`,
                               "Часть текста, которая должна содержаться в данных",
                                (val) => setQuickFilters(column, val, FILTER_TAG_LIKE,record),
                                record[column.dataIndex]
                    );
                } else {
                    setQuickFilters(column, record[column.dataIndex], filter=="neq"?FILTER_TAG_NEQ:FILTER_TAG_EQ,record);
                }
                dlginterface.close();
            }

            let timer: ReturnType<typeof setTimeout>;


            expandedTableColumns[1].onCell=(record: any, rowIndex: number) => {
                return {
                    onTouchStart: (event: any) => {
                        console.log("ontouchstart");
                        timer = setTimeout(()=>onLongTouch(hiddenColumns[rowIndex],record.value), LONG_TOUCH_DURATION);
                    },
                    onTouchEnd: (event: any) => {
                        if(timer) {
                            event.preventDefault();
                            clearTimeout(timer);
                        }
                        console.log("ontouchend");
                    },
                };
            }
            expandedTableColumns[0].onCell=(record: any, rowIndex: number) => {
                return {
                    onClick: (event: any) => {
                        handleSort(hiddenColumns[rowIndex]);
                    }
                }
            };

            return (
                <Table rowKey={"columnName"}
                    columns={expandedTableColumns}
                    dataSource={data}
                    pagination={false}
                    showHeader={false}
                    footer={()=>ColumnDialogMobile({interface:dlginterface, onSortNext:handleSort,onFilter:handleFilter})}
                />
            );
        }
    }
    const expandedRowRender: any = hiddenColumns.length > 0 ? renderExpandRowForMobile : null;

    const downloadData = React.useCallback((params: any, succFn: (value: any) => any, errorFn?: (value: any) => any) => {
        console.log("request params", params);
        setLoading(true);
        requestToAPI.post(props.uri.forSelect, params)
            .then(response => {
                // если компонент размонтирован не надо устанавливать данные
                if (!contextParams.mountFlag) return;
                succFn(response)
                setLoading(false);
            })
            .catch((error) => {
                console.log(error);
                // если компонент размонтирован не надо устанавливать данные
                if (!contextParams.mountFlag) return;
                setLoading(false);
                if (errorFn) errorFn(error);
                const key = `notification${Date.now()}`;
                notification.error({
                    key:key,
                    message: MSG_REQUEST_ERROR,
                    description: error.message,
                    btn: getLoginButton(error.status, history)
                })
            })

    }, [props, contextParams.mountFlag, history])

    const updateStatusSeachAndFilter = React.useCallback(() => {
        // Если изменилась строка поиска переходим на первую страницу
        if (requestParams.search != lastSearchAndFilterState.search) {
            requestParams.pagination.current = 1;
        }
        lastSearchAndFilterState.search = requestParams.search;

        // Аналогично с фильтрами, только фильтра - объект
        if (JSON.stringify(requestParams.filters) !== JSON.stringify(lastSearchAndFilterState.filters)) {
            requestParams.pagination.current = 1;
        }
        lastSearchAndFilterState.filters = Object.assign({}, requestParams.filters);
    }, [requestParams, lastSearchAndFilterState])

    const refreshData = React.useCallback(() => {
        if (props.onBeforeRefresh) {
            if (!props.onBeforeRefresh(requestParams)) {
                // сброс отметок записей
                setSelectRows([]);
                // установка пакета данных
                setData([]);
                requestParams.pagination.total = 0;
                return;
            }
        }
        updateStatusSeachAndFilter();
        downloadData(requestParams, (response: any) => {
            // сброс отметок записей
            setSelectRows([]);
            // установка пакета данных
            const allrecord = props.transformerData?
                props.transformerData(response.result):response.result;
            setData(allrecord);
            if (defaultSelectRows) {
                if (response.result.length == 1)
                    setSelectRows([response.result[0].code]);
            }
            requestParams.pagination.total = response.allRowCount;
            requestParams.pagination.showTotal = ()=>`Всего ${requestParams.pagination.total}`;
            if (props.onAfterRefresh) {
                props.onAfterRefresh(allrecord);
            }
        }, () => {
            if (props.onAfterRefresh) {
                props.onAfterRefresh([]);
            }
        })
    }, [props, requestParams, downloadData, updateStatusSeachAndFilter])

    // ищем свойства shorthotkey у MenuItem, после этого вызываем onClick
    const handleHotKey = (event: any, record: any) => {
        const checkHotKey = (hotKey: any) => {
            return event.ctrlKey == !!hotKey.ctrlKey &&
                event.altKey == !!hotKey.altKey &&
                event.shiftKey == !!hotKey.shiftKey &&
                event.keyCode == hotKey.keyCode;
        }
        const handleInChildren = (children: any): any => {
            return React.Children.map(children, mi => {
                if (mi.props && mi.props.shorthotkey && checkHotKey(mi.props.shorthotkey)) {
                    return mi;
                }
                if (mi.props && mi.props.children) {
                    return handleInChildren(mi.props.children);
                }
            })
        }
        if (props.recordMenu) {
            const mi = handleInChildren(props.recordMenu(record).props.children);
            if (mi.length > 0) {
                event.preventDefault();
                event.stopPropagation();
                mi[0].props.onClick(event, undefined, record, {});
            }
        }
    }

    const deleteData = React.useCallback(() => {
        let ids = selectRows.join(',');
        confirm(format(MSG_CONFIRM_DELETE, selectRows.length), () => {
            console.log("Delete record " + ids);
            requestToAPI.post(props.uri.forDelete, ids.split(","))
                .then(response => {
                    // финализация выполнения
                    refreshData();
                    notification.success({
                        message: MSG_DELETE_SUCCESS
                    })
                    if (props.onAfterDelete) {
                        props.onAfterDelete();
                    }
                })
                .catch(error => {
                    notification.error({
                        message: MSG_DELETE_ERROR,
                        description: error.message
                    })
                    if (props.onAfterDelete) {
                        props.onAfterDelete();
                    }
                })
        })
    }, [props, selectRows, refreshData])


    React.useEffect(() => {
        contextParams.mountFlag = true;
        if (!data && autoRefresh) {
            setData([]); // важно, иначе начальный refresh выполняется несколько раз
            refreshData();
        }
        // размонтирования компонента сбросит флаг
        return (): any => contextParams.mountFlag = false;
    }, [data, autoRefresh, refreshData, contextParams]);

    // для нормальной сортировки нужно установить handleHeaderClick
    React.useEffect(() => {
        // робочный эффект вызывается слишком рано. не все олонки фсормированы
        setTimeout(() => {
            // например, при прямой ссылке на модуль и дальнейшем появлении окна логирования этот код срабатывает
            // но монтирование таблицы было отменено
            if (refOuter.current) {
                const columns = refOuter.current.getElementsByClassName("ant-table-column-has-sorters");
                for (let c of columns) {
                    c.onclick = (ev: any) => handleHeaderClick(ev, c);
                }
            }
        }, 100);

    }, [handleHeaderClick, columns])

    const request = React.useCallback((pagination: any, filters: any, sorter: any) => {
        requestParams.sort = buildSortFromColumns(sorter);
        requestParams.pagination.current = pagination.current;
        requestParams.pagination.pageSize = pagination.pageSize;
        refreshData();
    }, [requestParams, refreshData])

    const setQuickFilters = React.useCallback((column: any, value: any, suffix: string, record: any) => {
        // если есть column.getDataIndex то имя колонки может быть динамическим
        const fldIndex = column.getDataIndex?column.getDataIndex(record):column.dataIndex;
        // если имя колонки динамическое, то и значение, кроме like, нужно перевычислить
        if(column.getDataIndex && suffix !== FILTER_TAG_LIKE) {
            value = record[fldIndex];
        }
        // вычисляем саму операцию и значение
        let oper = suffix;
        if(value === undefined || value === null) {
            const notFlag = suffix == FILTER_TAG_NEQ;
            oper = FILTER_TAG_ISNULL;
            value = notFlag?false:true;
        }

        const keyFilter = "quick." + fldIndex + "." + oper;
        // вызов трансформера, если есть. старое значение перепишем новым
        if(transformerQuickFilters) {
            const newvalue = transformerQuickFilters(column, value);
            if(newvalue) {
                value = newvalue;
            }
        }
        requestParams.filters[keyFilter] = value;
        filterColumns[keyFilter] = column;
        refreshData();
    }, [requestParams, filterColumns, refreshData,transformerQuickFilters])

    const removeQuickFilters = React.useCallback((ev: any) => {
        let key = ev.target.parentNode.parentNode.id;
        if (key == "") {
            key = ev.target.parentNode.parentNode.parentNode.id;
        }
        delete requestParams.filters[key];
        delete filterColumns[key];
        refreshData();
    }, [refreshData, filterColumns, requestParams.filters])

    const removeAllQuickFilters = React.useCallback((ev: any) => {
        Object.keys(requestParams.filters)
            .filter(key=>key.startsWith("quick."))
            .forEach(key=>{
                delete requestParams.filters[key];
                delete filterColumns[key];
            })
        refreshData();
    }, [refreshData, filterColumns, requestParams.filters])

    const filterOperationName =(filterKey: string, value: any)=>{
        return filterKey.endsWith("."+FILTER_TAG_EQ) ? " = " :
                    filterKey.endsWith("."+FILTER_TAG_NEQ) ? " <> " :
                        filterKey.endsWith("."+FILTER_TAG_LIKE)? " содержит ":
                            filterKey.endsWith("."+FILTER_TAG_ISNULL)?value?"[ не определен ]":" [ определен ] ":
                            " [ ? ] "
    }

    const buildTitle = React.useCallback(() => {
        let qfilters: QfiltersItemType[] = [];
        for (const key in requestParams.filters) {
            if (key.startsWith("quick.")) {
                const column = filterColumns[key];
                if(column) {
                    let value = requestParams.filters[key];
                    if(column.renderForFilter) {
                        value = column.renderForFilter(value);
                    }
                    qfilters.push({
                        key: key,
                        title: column.title,
                        value: value,
                        oper: filterOperationName(key,value),
                        operTag: key.substring(key.lastIndexOf('.') + 1)
                    });
                }   
            }
        }
        return qfilters.length > 0 ?
            () => <div><span style={{ marginLeft: 8, marginRight: 16 }}>Быстрый фильтр:</span>
                {qfilters.map(f => <Tag id={f.key} key={f.key} color="blue" closable onClose={removeQuickFilters}>
                    {f.title}{f.oper}{f.operTag == FILTER_TAG_LIKE ? "[" : ""}{f.value}{f.operTag == FILTER_TAG_LIKE ? "]" : ""}</Tag>)
                }
                {quickFilterResetButtonVisible?
                    <CloseCircleOutlined className={classes["filter-panel-close-btn"]} style={{ display: "inline" }} onClick={removeAllQuickFilters} />
                    :""
                }
            </div>
            : undefined;
    }, [filterColumns, requestParams.filters, removeQuickFilters, quickFilterResetButtonVisible,removeAllQuickFilters]);

    const rowSelection: objectWithAnyFields = {
        type: selectType,
        selectedRowKeys: selectRows,
        onChange: (rows: any[]) => {
            setSelectRows([...rows]);
        },
        selections: [
            Table.SELECTION_ALL,
            Table.SELECTION_INVERT,
            {
                key: 'Reset',
                text: 'Убрать все отметки',
                onSelect: (changableRowKeys: any) => {
                    setSelectRows([]);
                }
            }
        ]
    };

    React.useEffect(() => {
        if (props.onSelectedChange != null) {
            props.onSelectedChange(selectRows);
        }
    }, [selectRows]); // eslint-disable-line

    const callForm = React.useCallback((record: any, event: any) => {
        // kav:предотвращаем вызов диалога при нажатии на клетку с чекбоксом 
        // и дополнительно вызывает выбор записи, для улучшения юзабилити
        if(selectable && getTableTD(event.target).cellIndex==0) {
            const input = event.target.getElementsByTagName("input");
            input[0].click();
            return;
        }
        if (event.altKey) {
            event.preventDefault();
            event.stopPropagation();
            const column = props.columns[getTableTD(event.target).cellIndex -  (selectable?1:0)];
            if (column && !column.disableQuickFilter) {
                const isDateColumn = column.render==drawDate || column.render==drawDateAndTime ||
                    (column.dataType && (column.dataType==ColumnTypes.DATE || column.dataType==ColumnTypes.DATETIME));
                if (event.ctrlKey && !isDateColumn) {
                    inputValue(`Быстрый фильтр по полю "${column.title}"`,
                        "Часть текста, которая должна содержаться в данных",
                        (val) => setQuickFilters(column, val, FILTER_TAG_LIKE,record),
                        record[column.dataIndex]
                    );
                } else {
                    setQuickFilters(column, record[column.dataIndex], FILTER_TAG_EQ,record);
                }
            }
        } else {
            if (editable) {
                if (props.editCallBack) props.editCallBack(record);
            } else {
                if (selectable && selectType == "radio") {
                    setSelectRows([record[idName]]);
                }
            }
        }
    }, [props, setQuickFilters])

    // interface содержит методы, которые можно применять к функциональному компоненту
    // в стиле компонента, построенного на классах
    if (props.interface) {
        props.interface.refreshData = refreshData;
        props.interface.isLoading = () => loading;
        props.interface.SetRows = (values: any[]) => {
            if (data && data.find(d => d["code"] == values[0])) {
                setSelectRows([...values]);
            }
        };

        props.interface.getSelectedRows = () => rowSelection.selectedRowKeys;
        props.interface.setSelectedRows = (ids:any[]) => setSelectRows([...ids]);
        props.interface.setSelectAllRows = () => setSelectRows(data?.map(r =>r[idName]));
        props.interface.getSelectedRecords = () => rowSelection.selectedRowKeys.map((idValue: number) => data?.filter(r => idValue == r[idName])[0]);
        props.interface.deleteData = deleteData;
        props.interface.requestParams = requestParams;
        props.interface.insFirstRecord = (values: any) => {
            // добавляем в текущий пакет
            if (data) setData([values, ...data])
            else setData([values])
        };
        props.interface.updateRecord = (values: any) => {
            // изменяем в текущем пакете
            const updId = values[idName];
            // Чтобы заставить таблицу обновлять запись приходится 
            // не только подменять data, но и объект в data. 
            // Все из-за shallow compare в Antd Table
            const array:any = data?.map(r => {
                if(r[idName]=== updId) {
                    return values
                }
                else{
                    return r
                }
            })
            setData(array)
        };
        props.interface.getProperties = () => {
            return {
                props: props
            }
        }
        props.interface.exportData = (destType: any) => {
            // получение данных без страниц
            const paramsAllRecords = { ...requestParams };
            paramsAllRecords.pagination = { current: 1, pageSize: -1 };
            downloadData(paramsAllRecords, (response) => {
                const fname = props.exportNameFile || props.uri.forSelect.replace('/', '_');
                const items = response.result
                switch (destType) {
                    // csv
                    case 1:
                        exportJsonToCVS(items, props.columns, fname + ".csv")
                        break;
                    // xls
                    case 2:
                        exportJsonToExcel(items, props.columns, fname + ".xlsx")
                        break;

                    default:
                        break;
                }
            })
        }
    }

    const getRowClass = React.useCallback((record: any, index: number) => {
        let clss = editable ? "table-editable-row" : "";
        const id = record[idName];
        if (updateRecords.find(r => r[idName] == id)) {
            clss += " table-update-row";
        }
        if (props.getRowClass) {
            clss += props.getRowClass(record) ?? "";
        }
        return clss;
    }, [props, idName]);

    const hideAllRecordMenu = () => {
        // у всей страницы сбрасываем видимость меню записи
        if (data) {
            data.forEach(r => {
                const mnu = r["mnu"];
                if (mnu) {
                    mnu.visibleMenuRecordPopover = false;
                }
            })
        }
        forceUpdate();
    }
    const recordMenuFound = !!props.recordMenu;

    const menuRecordContent = (record: any) => (
        <Menu onClick={(ev: any) => hideAllRecordMenu()}>
            {props.recordMenu
                ? React.Children.map(props.recordMenu(record).props.children, mi => mi)
                : undefined}
        </Menu>
    )

    let servColumn;
    if (recordMenuFound) {
        servColumn = {
            dataIndex: "mnu",
            serv: true, // сервисная колонка
            sorter: false,
            width: "60px",
            render: (data: any, record: any) => {
                if (!data) {
                    record["mnu"] = {}
                    data = record["mnu"];
                }

                if (data.visibleMenuRecordPopover) {
                    document.addEventListener(`click`, function onClickOutside() {
                        hideAllRecordMenu();
                        document.removeEventListener(`click`, onClickOutside)
                    })
                }
                return <Popover visible={data.visibleMenuRecordPopover}
                    onVisibleChange={(value) => data.visibleMenuRecordPopover = value}
                    overlayClassName="table-record-menu"
                    placement="leftTop"
                    content={() => menuRecordContent(record)}
                    trigger="click">
                    <MoreOutlined className={classes["row-menu-button"]} onClick={ev => {
                        ev.stopPropagation();
                        data.visibleMenuRecordPopover = true;
                        forceUpdate();
                    }} />
                </Popover>
            }
        }
    }

    return <div ref={refOuter} className={className}>
        <Table rowKey={idName}
            locale={{
                emptyText: "Нет данных"
            }}
            columns={servColumn ? [...columns, servColumn] : columns}
            dataSource={data ? data : undefined}
            loading={loading}
            rowClassName={getRowClass}
            pagination={requestParams.pagination}
            rowSelection={selectable ? rowSelection : undefined}
            expandedRowRender={expandedRowRender}
            title={buildTitle()}
            size={"small"}
            showSorterTooltip={false}
            onRow={(record, rowIndex) => {
                return {
                    onClick: event => callForm(record, event),
                    onContextMenu: event => {
                        // system menu
                        if (event.ctrlKey) {
                            return
                        }
                        event.preventDefault();
                        document.addEventListener(`click`, function onClickOutside() {
                            setPopupState({ visible: false })
                            document.removeEventListener(`click`, onClickOutside)
                        })
                        setPopupState({
                            record,
                            columns,
                            visible: true,
                            x: event.clientX,
                            y: event.clientY,
                            tableInterface: props.interface,
                            statuses: props.statuses,
                            selectable: selectable,
                        })
                    },
                    onMouseEnter: (event: any) => {
                        // чтобы работал пробел для выделенной записи
                        const tr = event.target.parentNode || {};
                        const comp = tr.firstChild ? tr.firstChild.firstChild || {} : {};
                        if (comp.nodeName == "LABEL") {
                            const input = comp.firstChild.firstChild;
                            input.focus();
                            input.onkeydown = (eventKey: any) => handleHotKey(eventKey, record);
                        }
                    }
                };
            }}
            onChange={request}
            ref={ref}
            {...otherProps} />
        <PropertyesPopupMenu {...popupState} />
    </div>
});

export default withStyles(styles)(DataTable);
