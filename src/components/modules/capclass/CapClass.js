import React from 'react';
import { Button, Form } from 'antd';
import DataTable from "../../lib/DataTable";
import ModernApp from '../../App2'
import ModuleHeader from "../../lib/ModuleHeader";
import { FilterPanelExt } from "../../lib/FilterPanelExt";
import { FilterButton } from '../../lib/FilterButton';
import { useParams, withRouter } from "react-router";
import { BUTTON_ADD_LABEL, BUTTON_DEL_LABEL, BUTTON_REFRESH_LABEL, DEFAULT_TABLE_CONTEXT } from "../../lib/Const";
import { DrawBoolIcon, buildURL, getCapClassTypeName } from "../../lib/Utils";
import EditForm from "../../lib/EditForm";
import CapClassForm from "./CapClassForm";
import { CONTOUR_REFBOOKS, MODULE_CAPCLASS } from "../../lib/ModuleConst"
import { responsiveMobileColumn, isMobile } from '../../lib/Responsive';
import { AppAffix } from "../../lib/AppAffix";

const CONTOUR = CONTOUR_REFBOOKS;
const MODULE = MODULE_CAPCLASS;

// Сущность (в CamelCase)
const ENTITY = "CapClass";
const ID_NAME = ENTITY.charAt(0).toLowerCase() + ENTITY.slice(1) + "Id"
// URI для использования формой со списком (текущей) и формой добавления/изменения
const URI_FOR_GET_LIST = buildURL(CONTOUR, MODULE, ENTITY) + "/getlist";
const URI_FOR_GET_ONE = buildURL(CONTOUR, MODULE, ENTITY) + "/get";
const URI_FOR_SAVE = buildURL(CONTOUR, MODULE, ENTITY) + "/save";
const URI_FOR_DELETE = buildURL(CONTOUR, MODULE, ENTITY) + "/delete";

// автоматическое обновление при монтировании компонента
const AUTO_REFRESH = true;
// Конвертация значений, приходящих и уходящих через API
const CONVERTORS = {
    date: []
}

// колонки в таблице
const COLUMNS = [
    {
        title: 'Код',
        dataIndex: 'capClassCode',
        sorter: true,
        width: "80px",
        ellipsis: true,
        responsive: responsiveMobileColumn(),
    },
    {
        title: 'Наименование',
        dataIndex: 'capClassName',
        sorter: true,
        ellipsis: true,
        defaultSortOrder: 'ascend',
    },
    {
        title: 'Примечание',
        dataIndex: 'capClassRemark',
        sorter: true,
        ellipsis: true,
        responsive: responsiveMobileColumn(),
    },
    {
        title: 'Блокировка',
        dataIndex: 'capClassBlockflag',
        sorter: true,
        width: "120px",
        render: DrawBoolIcon,
        responsive: responsiveMobileColumn(),
    }
]

// Уникальный идентификатор формы редактировавания
const EDIT_FORM_ID = ENTITY.toLowerCase() + "-frm";
// Форма для редактирования
const buildForm = (form, capClassTypeId) => {
    return <CapClassForm form={form} initialValues={{ capClassTypeId: capClassTypeId }} />
}
// размер формы, -1 - по умолчанию, FORM_MAX_WIDTH - максимальная ширина
const FORM_WIDTH = -1;

// Создание компонент для фильтров
// key это уникальное имя фильтра, попадает в REST API
const buildFilters = () => {
    return <React.Fragment>

    </React.Fragment>
}
// начальное значение фильтров
// если значение фильра не объект, а простое значение,
// то значение имени свойства компонента принимается как defaultValue компонента
const initFilters = {
}

//===============================================================================
// Основной функциональный компонент
//===============================================================================
/**
 * Таблица передает на сервер post-запрос в теле которого
 * pagination - информация о странице
 * sort - сортировка
 * filters - фильтры (+ быстрые фильтры начинаются с quick.*)
 * search - строка полнотекстового поиска
 */
const CapClass = (props) => {
    let [formVisible, setFormVisible] = React.useState(false);
    let [editorContext] = React.useState({
        uriForGetOne: URI_FOR_GET_ONE,
        uriForSave: URI_FOR_SAVE,
    });
    const [tableInterface] = React.useState(Object.assign({}, DEFAULT_TABLE_CONTEXT));
    const [form] = Form.useForm();
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    const [updateRecords, setUpdateRecords] = React.useState([]);
    const { capClassTypeId } = useParams();
    const capClassTypeName = getCapClassTypeName(capClassTypeId);

    const setFilters = React.useCallback((config) => {
        tableInterface.requestParams.filters = config;
        tableInterface.refreshData();
    }, [tableInterface])

    React.useEffect(() => {
        if (tableInterface.requestParams.filters.capClassTypeId !== +capClassTypeId) {
            tableInterface.refreshData();
        }
    }, [tableInterface, capClassTypeId]);


    const callForm = React.useCallback((id) => {
        editorContext.id = id;
        setFormVisible(true);
    }, [editorContext])

    // тут формируются кнопки
    const buttons = [
        <Button key="del" onClick={() => tableInterface.deleteData()}
            disabled={tableInterface.isLoading() || tableInterface.getSelectedRows().length == 0}>{BUTTON_DEL_LABEL}</Button>,
        <Button key="refresh" onClick={() => tableInterface.refreshData()}>{BUTTON_REFRESH_LABEL}</Button>,
        <Button key="add" onClick={() => callForm()}
            type="primary">{BUTTON_ADD_LABEL}</Button>
    ];
    if (isMobile()) {
        const filters = buildFilters();
        buttons.push(<FilterButton key="filter" filters={filters}
            onChange={(fc) => setFilters(fc)}
            initValues={initFilters} />);
    }

    const afterEdit = React.useCallback((values) => {
        tableInterface.updateRecord(values);
        setUpdateRecords([...updateRecords, values])
    }, [tableInterface, updateRecords])
    const afterAdd = React.useCallback((values) => {
        tableInterface.insFirstRecord(values);
        setUpdateRecords([...updateRecords, values])
    }, [tableInterface, updateRecords])

    return (
        <ModernApp buttons={buttons}>
            <AppAffix>
                <div>
                    <ModuleHeader
                        title={capClassTypeName}
                        onSearch={value => {
                            tableInterface.requestParams.search = value;
                            tableInterface.refreshData();
                        }}
                        buttons={buttons}
                    />
                    <FilterPanelExt onChange={(fc) => setFilters(fc)} initValues={initFilters}>
                        {buildFilters()}
                    </FilterPanelExt>
                </div>
            </AppAffix>
            <DataTable className="mod-main-table"
                uri={{
                    forSelect: URI_FOR_GET_LIST,
                    forDelete: URI_FOR_DELETE
                }}
                columns={COLUMNS}
                autoRefresh={AUTO_REFRESH}
                editCallBack={(record) => callForm(record[ID_NAME])}
                interface={tableInterface}
                onSelectedChange={() => forceUpdate()}
                onBeforeRefresh={() => {
                    tableInterface.requestParams.filters.capClassTypeId = +capClassTypeId;
                    return true;
                }}
                onAfterRefresh={() => setUpdateRecords([])}
                updateRecords={updateRecords}
                idName={ID_NAME}
            />
            <EditForm
                id={EDIT_FORM_ID}
                copyButtonFlag={true}
                visible={formVisible}
                form={form}
                width={FORM_WIDTH}
                editorContext={editorContext}
                afterSave={(response) => {
                    setFormVisible(false);
                    if (response) {
                        if (!editorContext.id) {
                            afterAdd(response)
                        } else {
                            afterEdit(response)
                        }
                    }
                }}
                afterCopy={afterAdd}
                afterCancel={() => {
                    setFormVisible(false);
                }}
                idName={ID_NAME}
                convertors={CONVERTORS}>
                {buildForm(form, capClassTypeId)}
            </EditForm>
        </ModernApp>
    )
}

export default withRouter(CapClass);
