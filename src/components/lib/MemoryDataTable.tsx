import React, {FC} from 'react';
import { Table, Tag, notification, Menu, Popover } from 'antd';
import { ExportOutlined, CopyOutlined, MoreOutlined } from '@ant-design/icons';
import {
    buildSortByDefaultFromColumns, buildSortFromColumns,
    getScalarSumField,
    getSumField,
    rebuildColumns, resetSortColumns
} from "./Utils";
import { confirm, inputValue } from "./Dialogs";
import { format } from 'react-string-format';
import {
    MIN_INT,
    MSG_CONFIRM_DELETE, MSG_SUCCESS_COPY_TO_CLIPBOARD
} from "./Const";
import { showPropertyDialog } from "./stddialogs/PropertyDialog"
import { extractValuesFromInitFilters } from './FilterUtils'
import { isMobile } from './Responsive';
import { MemoryDataSet } from "./MemoryDataSet";
import { EditableRow } from './EditableComponents';
import {objectWithAnyFields} from "./types";
import {TableRowSelection} from "antd/es/table/interface";
import {EditableCell} from "./EditableComponents";

const { SubMenu } = Menu;

// кол-во записей на страницу, по умолчанию
const DEFAULT_PAGE_SIZE = 10

const SORT_DIRECTIONS: string[] = ['ascend', 'descend']

function nextSortDirection(current: string) {
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

interface PropertyesPopupMenuProps {
    record: any,
    columns: any[],
    visible: boolean,
    x: number,
    y: number,
    tableInterface: objectWithAnyFields
}

const PropertyesPopupMenu: FC<PropertyesPopupMenuProps> = ({ record, columns, visible, x, y, tableInterface }) => {
    return (
        visible
        ? <div className="ant-popover ant-popover-inner" style={{ left: `${x}px`, top: `${y}px`, position: "fixed" }}>
                <Menu>
                    <SubMenu key={3} icon={<CopyOutlined />} title="Копировать">
                        <Menu.Item key='3.1' onClick={() => { copyRecords([record], columns) }}>Текущую запись</Menu.Item>
                        <Menu.Item key='3.2' onClick={() => { copyRecords(tableInterface.getSelectedRecords(), columns) }}>Отмеченные записи</Menu.Item>
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

function checkHiddenColumns(columns: any[]) {
    if (!isMobile()) return [];
    return columns.filter(c => c.responsive && c.responsive[0] == 'md');
}

const expandedTableColumns = [
    { title: "Колонка", dataIndex: "columnName", width: '30%', ellipsis: true },
    {
        title: "Значение", dataIndex: "value", ellipsis: true,
        render: (data: any, record: any) => record.render ? record.render(record.value, record) : data
    }
];

const handleOnChange = (onChange: ((value: any) => void) | undefined, memoryDataSet: typeof MemoryDataSet) => {
    if (onChange) {
        onChange({
            data: memoryDataSet.data.map((value: any) => value.record),
            delta: memoryDataSet.delta
        });
    }
};


interface MemoryDataTableProps {
    editable?: boolean,
    selectable?: boolean,
    selectType?: string,
    editCallBack?: (value: any) => void,
    defaultFilters?: objectWithAnyFields // тип-объект с различными полями
    autoRefresh?: boolean,
    interface?: objectWithAnyFields,
    onBeforeRefresh?: () => void,
    onAfterRefresh?: () => void,
    onAfterDelete?: () => void,
    updateRecords?: any[],
    idName?: string,
    data?: any[],
    columns: any[],
    onChange?: ((value: any) => void) | undefined,
    value?: any,
    recordMenu?: any,
    onSelectedChange?: (selectRows: any[]) => void,
    localFilter?: (value: any) => void
}

const MemoryDataTable = React.forwardRef<any, MemoryDataTableProps>(
    ({editable = true, autoRefresh = true,
         selectable = true, selectType = "checkbox",
         updateRecords = [], idName = "id",
         data = null, ...props}, ref) => {

    const refOuter = React.useRef<any>(null);
    let [_data] = React.useState(data ?? null);
    let [loading] = React.useState(false);
    let [selectRows, setSelectRows] = React.useState<any[]>([]);
    let [requestParams] = React.useState({
        // параметры запроса по умолчанию
        pagination: { current: 1, pageSize: DEFAULT_PAGE_SIZE, showSizeChanger: true },
        sort: buildSortByDefaultFromColumns(props.columns) || {},
        filters: props.defaultFilters ? extractValuesFromInitFilters(props.defaultFilters, true) : {},
    });
    const [filterColumns] = React.useState<objectWithAnyFields>({});
    const { columns, onChange, ...otherProps } = props;
    const [popupState, setPopupState] = React.useState<any>({
        visible: false,
        x: 0, y: 0
    });
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    const [hiddenColumns] = React.useState(checkHiddenColumns(columns));

    const [memoryDataSet] = React.useState(Object.create(MemoryDataSet));
    React.useEffect(() => {
        memoryDataSet.setOriginalData(props.value && props.value.data ? props.value.data : [], props.value && props.value.delta ? props.value.delta : []);
        forceUpdate();
    }, [memoryDataSet, props.value]);

    const handleHeaderClick = React.useCallback((ev: any, htmlCol: any) => {
        let offs = 0;
        if (selectable) offs = 1;
        if (hiddenColumns.length > 0) offs += 1;

        const column = columns[htmlCol.cellIndex - offs];
        const nextOrderDir = nextSortDirection(column.sortOrder);
        if (!ev.ctrlKey) {
            resetSortColumns(columns);
        }
        column.sortOrder = nextOrderDir;
    }, [columns, hiddenColumns.length, selectable]);

    rebuildColumns(columns);

    const renderExpandRowForMobile = (record: any, index: number, indent: any, expanded: boolean) => {
        if (expanded) {
            const data = hiddenColumns.map(c => {
                const data = { columnName: c.title, value: record[c.dataIndex], render: c.render };
                return data;
            });
            return (
                <Table rowKey={"columnName"}
                    columns={expandedTableColumns}
                    dataSource={data}
                    pagination={false}
                    showHeader={false}
                />
            );
        }
    }
    const expandedRowRender = hiddenColumns.length > 0 ? renderExpandRowForMobile : undefined;

    // ищем свойства shorthotkey у MenuItem, после этого вызываем onClick
    const handleHotKey = (event: any, record: any) => {
        const checkHotKey = (hotKey: any) => {
            return event.ctrlKey == !!hotKey.ctrlKey &&
                event.altKey == !!hotKey.altKey &&
                event.shiftKey == !!hotKey.shiftKey &&
                event.keyCode == hotKey.keyCode;
        }
        const handleInChildren: any = (children: any) => {
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
        confirm(format(MSG_CONFIRM_DELETE, selectRows.length) as string, () => {
            console.log("Delete record " + ids);
            selectRows.forEach(value => {
                memoryDataSet.data.forEach((data: any) => {
                    if (data.record[idName] === value) {
                        memoryDataSet.delete(data.record, idName);
                    }
                })
            });
            handleOnChange(onChange, memoryDataSet);
            forceUpdate();
            if (props.onAfterDelete) {
                props.onAfterDelete();
            }
            setSelectRows([]);
        })
    }, [props, selectRows, onChange, idName, memoryDataSet])

    // для нормальной сортировки нужно установить handleHeaderClick
    React.useEffect(() => {
        if (refOuter.current) {
            const columns = refOuter.current.getElementsByClassName("ant-table-column-has-sorters");
            for (let c of columns) {
                c.onclick = (ev: any) => handleHeaderClick(ev, c);
            }
        }
    }, [handleHeaderClick, columns, refOuter])

    const request = React.useCallback((pagination: objectWithAnyFields, filters: any, sorter: any) => {
        requestParams.sort = buildSortFromColumns(sorter);
        requestParams.pagination.current = pagination.current;
        requestParams.pagination.pageSize = pagination.pageSize;
    }, [requestParams])

    const setQuickFilters = React.useCallback((column: any, value: any, suffix: string) => {
        const keyFilter = "quick." + column.dataIndex + "." + suffix;
        requestParams.filters[keyFilter] = value;
        filterColumns[keyFilter] = column;
        // refreshData();
    }, [requestParams, filterColumns])

    const removeQuickFilters = React.useCallback((ev: any) => {
        let key = ev.target.parentNode.parentNode.id;
        if (key == "") {
            key = ev.target.parentNode.parentNode.parentNode.id;
        }
        delete requestParams.filters[key];
        delete filterColumns[key];
        // refreshData();
    }, [filterColumns, requestParams.filters])

    const buildTitle = React.useCallback(() => {
        let qfilters: any[] = [];
        for (const key in requestParams.filters) {
            if (key.startsWith("quick.")) {
                qfilters.push({
                    key: key,
                    title: filterColumns[key].title,
                    value: requestParams.filters[key],
                    oper: key.endsWith(".eq") ? " = " : " содержит ",
                    operTag: key.substring(key.lastIndexOf('.') + 1)
                });
            }
        }
        return qfilters.length > 0 ?
            () => <div><span style={{ marginLeft: 8, marginRight: 16 }}>Быстрый фильтр:</span>
                {qfilters.map(f => <Tag id={f.key} key={f.key} color="blue" closable onClose={removeQuickFilters}>
                    {f.title}{f.oper}{f.operTag == "like" ? "[" : ""}{f.value}{f.operTag == "like" ? "]" : ""}</Tag>)
                }
            </div>
            : undefined;
    }, [filterColumns, requestParams.filters, removeQuickFilters]);

    const rowSelection = {
        type: selectType,
        selectedRowKeys: selectRows,
        onChange: (rows: any) => {
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
        if (event.altKey) {
            const column = props.columns[getTableTD(event.target).cellIndex - 1];
            if (column) {
                if (event.ctrlKey) {
                    inputValue(`Быстрый фильтр по полю "${column.title}"`,
                        "Часть текста, которая должна содержаться в данных",
                        (val) => setQuickFilters(column, val, 'like'));
                } else {
                    setQuickFilters(column, record[column.dataIndex], 'eq');
                }
            }
        } else {
            if (editable) {
                props.editCallBack && props.editCallBack(record);
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
        props.interface.isLoading = () => loading;
        props.interface.getSelectedRows = () => rowSelection.selectedRowKeys;
        props.interface.setSelectedRows = (rows: any) => setSelectRows(rows);
        props.interface.getSelectedRecords = () => rowSelection.selectedRowKeys
            .map(idValue => memoryDataSet.data.filter((r: any) => idValue == (r[idName] ?? r.record[idName]))[0]);
        props.interface.deleteData = deleteData;
        props.interface.requestParams = requestParams;
        props.interface.insFirstRecord = (values: any) => {
            // Сгенерируем случайное id для новых записей
            values[idName] = Math.ceil(Math.random() * MIN_INT);
            // Запишем новую запись в датасет
            memoryDataSet.insert(values);
            handleOnChange(onChange, memoryDataSet);
            forceUpdate();
        };
        props.interface.updateRecord = (values: any) => {
            memoryDataSet.update(values, idName);
            handleOnChange(onChange, memoryDataSet);
            forceUpdate();
        };
        props.interface.getProperties = () => {
            return {
                props: props
            }
        };
        props.interface.getNextInField = (field: string | number) => {
            let maxValue = 0;
            memoryDataSet.data.forEach((value: any) => {
                if (value.record[field] > maxValue) {
                    maxValue = value.record[field];
                }
            });
            return maxValue + 1;
        };
        props.interface.getSumField = (field: string | number) => getSumField(memoryDataSet.data, field);
        props.interface.getScalarSumField = (fieldA: string | number,
                                             fieldB: string | number) => getScalarSumField(memoryDataSet.data, fieldA, fieldB);
        props.interface.memoryDataSet = memoryDataSet;
    }

    const getRowClass = React.useCallback((record: any) => {
        let clss = "editable-row" + (editable ? " table-editable-row" : "");
        const id = record[idName];
        if (updateRecords.find(r => r[idName] == id)) {
            clss += " table-update-row";
        }
        return clss;
    }, [updateRecords, editable, idName]);

    const hideAllRecordMenu = () => {
        // у всей страницы сбрасываем видимость меню записи
        if (_data) {
            _data.forEach(r => {
                const mnu = r["mnu"];
                if (mnu) {
                    mnu.visibleMenuRecordPopover = false;
                }
            })
        }
        forceUpdate();
    }
    const recordMenuFound = props.recordMenu;

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
            width: 40,
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
                    <MoreOutlined onClick={ev => {
                        ev.stopPropagation();
                        data.visibleMenuRecordPopover = true;
                        forceUpdate();
                    }} />
                </Popover>
            }
        }
    }

    const getColumns = React.useCallback(() => {
        return columns.map((col) => {
            if (!col.editable) {
                return col;
            }
            return {
                ...col,
                onCell: (record: any) => ({
                    record,
                    editable: col.editable,
                    dataIndex: col.dataIndex,
                    title: col.title,
                    editComponentName: col.editComponentName,
                    required: col.required ?? false,
                    handleSave: props?.interface?.updateRecord,
                }),
            };
        });
    }, [columns, props?.interface?.updateRecord]);

    return <div ref={refOuter}>
        <Table rowKey={idName}
            locale={{
                emptyText: "Нет данных"
            }}
            columns={servColumn ? [getColumns(), servColumn] : getColumns()}
            dataSource={memoryDataSet.data.map((value: any) => value.record).filter((r: any) =>!props.localFilter || props.localFilter(r))}
            loading={loading}
            rowClassName={getRowClass}
            pagination={requestParams.pagination}
            rowSelection={selectable ? rowSelection as TableRowSelection<any> : undefined}
            expandedRowRender={expandedRowRender}
            title={buildTitle()}
            size={"middle"}
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
                            tableInterface: props.interface
                        })
                    },
                    onMouseEnter: (event: any) => {
                        // чтобы работал пробел для выделенной записи
                        const tr = event.target.parentNode || {};
                        const comp = tr.firstChild ? tr.firstChild.firstChild || {} : {};
                        if (comp.nodeName == "LABEL") {
                            const input = comp.firstChild.firstChild;
                            // Убрал чтобы фокус не терялся в формах добавления/изменения
                            // input.focus();
                            input.onkeydown = (eventKey: any) => handleHotKey(eventKey, record);
                        }
                    }
                };
            }}
            onChange={request}
            ref={ref}
            components={{
                body: {
                    row: EditableRow,
                    cell: EditableCell,
                }
            }}
            {...otherProps} />
        <PropertyesPopupMenu {...popupState} />
    </div>
});

export default MemoryDataTable;
