import React from 'react';
import { Button, Menu, Dropdown, Form } from 'antd';
import DataTable from "../../lib/DataTable";
import ModernApp from '../../App2'
import ModuleHeader from "../../lib/ModuleHeader";
import {FilterPanelExt} from "../../lib/FilterPanelExt";
import { FilterButton } from '../../lib/FilterButton';
import { withRouter } from "react-router";
import { BUTTON_ADD_LABEL, BUTTON_DEL_LABEL, BUTTON_REFRESH_LABEL, DEFAULT_TABLE_CONTEXT} from "../../lib/Const";
import { MoreOutlined, UnorderedListOutlined, UsergroupAddOutlined} from '@ant-design/icons';
import { DrawBoolIcon, drawDateAndTime, buildURL, drawDate } from "../../lib/Utils";
import EditForm, { ShowModal } from "../../lib/EditForm";
import CapResourceForm from "./CapResourceForm";
import { CONTOUR_ADMIN, MODULE_CONFIG } from "../../lib/ModuleConst"
import { buildPrintMenu, buildEntityPrintMenu } from '../../lib/stddialogs/PrintDialog';
import { responsiveMobileColumn, isMobile } from '../../lib/Responsive';
import { RESOURCE_CONSTANT, RESOURCE_NUMBERING, RESOURCE_PRINTFORM } from '../../lib/CapResourceType';
import { useParams } from "react-router-dom";
import { ConstantValue } from "./ConstantValue";
import { AppAffix } from "../../lib/AppAffix";
import {useDialog} from "../../lib/Dialogs";
import {SetPasswordProgUserForm} from "../admin/SetPasswordProgUserForm";
import * as CapResources from "../../lib/CapResourceType";
import { DatabaseOutlined } from '@ant-design/icons';
import {ModelViewerForm} from "./ModelViewerForm";

const MOD_TITLE = "Ресурсы";
const CONTOUR = CONTOUR_ADMIN;
const MODULE = MODULE_CONFIG;

// Сущность (в CamelCase)
const ENTITY = "Artifact";
const ID_NAME = ENTITY.charAt(0).toLowerCase() + ENTITY.slice(1) + "Id"
// URI для использования формой со списком (текущей) и формой добавления/изменения
const URI_FOR_GET_LIST = buildURL(CONTOUR, MODULE, ENTITY) + "/getlist";
const URI_FOR_GET_ONE = buildURL(CONTOUR, MODULE, ENTITY) + "/get";
const URI_FOR_GET_MODEL = buildURL(CONTOUR, MODULE, ENTITY) + "/get/asmodel";
const URI_FOR_SAVE = buildURL(CONTOUR, MODULE, ENTITY) + "/save";
const URI_FOR_DELETE = buildURL(CONTOUR, MODULE, ENTITY) + "/delete";

// автоматическое обновление при монтировании компонента
const AUTO_REFRESH = false;
// Конвертация значений, приходящих и уходящих через API
const CONVERTORS = {
    date: ["artifactDate"]
}

// колонки в таблице
const COLUMNS = [
    {
        title: 'Код',
        dataIndex: 'artifactCode',
        sorter: true,
        ellipsis: true,
        width: "120px",
    },
    {
        title: 'Наименование',
        dataIndex: 'artifactName',
        sorter: true,
        ellipsis: true,
        defaultSortOrder: 'ascend',
    },
    {
        title: 'Блокировка',
        dataIndex: 'artifactVisibleFlag',
        sorter: true,
        responsive: responsiveMobileColumn(),
        render: DrawBoolIcon,
        width: "120px",
    },
    {
        title: 'Дата модификации',
        dataIndex: 'artifactLastmodify',
        sorter: true,
        responsive: responsiveMobileColumn(),
        render: drawDateAndTime,
        renderForFilter: drawDate,
        width: "180px",
    },
    {
        title: 'Пользователь',
        dataIndex: 'lastProguserName',
        sorter: true,
        ellipsis: true,
        responsive: responsiveMobileColumn(),
        width: "200px",
    },
]

// Уникальный идентификатор формы редактировавания
const EDIT_FORM_ID = ENTITY.toLowerCase() + "-frm";
// Форма для редактирования
const buildForm = (form, resourceTypeId) => {
    return <CapResourceForm form={form} resourceTypeId={resourceTypeId} initialValues={{ resourceTypeId: resourceTypeId }} />
}

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

// дополнительные команды
// если меню нет, то и кнопки нет
const buildMenuCommand = (config, handleMenuClick) => {
    return <Menu onClick={handleMenuClick}>
        {buildPrintMenu(MODULE.name, config)}
    </Menu>
};

// обрабочик меню
const buildMenuHandler = (config) => {
    return (ev) => {
        console.log('click', ev);
    }
}

const handleConstantValueMenu = (ev, record, config) => {
    if (ev.domEvent) {
        ev.domEvent.stopPropagation(); // чтобы предовратить запуск окна редактирования
    }
    config.editorContext = {}
    // формируем диалог
    const dialog = ShowModal({
        ...config,
        title: "Значения константы \"" + record.artifactName + "\"",
        content: <ConstantValue constantId={record.artifactId} />,
        width: 700
    });
    // вставляем Modal в top layer
    config.setTopLayer([...config.topLayer, dialog])
}

// меню для записи
const buildRecordMenuHandler = (modalConfig, config, record) => {
    return (
        <React.Fragment>
            {config.resourceTypeId == RESOURCE_CONSTANT
                ? <>
                    <Menu.Divider />
                    <Menu.Item key="constantValue" icon={<UnorderedListOutlined />}
                               onClick={(ev) => handleConstantValueMenu(ev, record, modalConfig)}>Значения константы</Menu.Item>
                </>
                : ""
            }
        </React.Fragment>
    )
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
const CapResource = (props) => {
    let [formVisible, setFormVisible] = React.useState(false);
    const [topLayer, setTopLayer] = React.useState([]);
    let [editorContext] = React.useState({
        uriForGetOne: URI_FOR_GET_ONE,
        uriForSave: URI_FOR_SAVE,
    });
    const [tableInterface] = React.useState(Object.assign({}, DEFAULT_TABLE_CONTEXT));
    const [form] = Form.useForm();
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    const [updateRecords, setUpdateRecords] = React.useState([]);
    const [menuCommand] = React.useState(buildMenuCommand(buildMenuHandler({
        'topLayer': topLayer,
        'setTopLayer': setTopLayer,
        'form': form,
        'tableInterface': tableInterface,
        'destroyDialog': (dlgId) => {
            // нужно через timeout так как после вызова destroyDialog следуют обращения к state
            setTimeout(() => { setTopLayer([...topLayer.filter(c => c.props.id != dlgId)]) }, 100)
        }
    })));
    let { resourceTypeId } = useParams();

    React.useEffect(() => {
        if (tableInterface.requestParams.filters.resourceTypeId !== +resourceTypeId) {
            tableInterface.refreshData();
        }
    }, [tableInterface, resourceTypeId]);

    const setFilters = React.useCallback((config) => {
        tableInterface.requestParams.filters = config;
        tableInterface.refreshData();
    }, [tableInterface])


    const callForm = React.useCallback((id) => {
        editorContext.id = id;
        setFormVisible(true);
    }, [editorContext])

    // тут формируются кнопки
    const buttons = [
        <Button key="del" onClick={() => tableInterface.deleteData()}
            hidden={(resourceTypeId == RESOURCE_PRINTFORM) || (resourceTypeId == RESOURCE_NUMBERING)}
            disabled={tableInterface.isLoading() || tableInterface.getSelectedRows().length == 0}>{BUTTON_DEL_LABEL}</Button>,
        <Button key="refresh" onClick={() => tableInterface.refreshData()}>{BUTTON_REFRESH_LABEL}</Button>,
        <Button key="add" onClick={() => callForm()}
            hidden={(resourceTypeId == RESOURCE_PRINTFORM) || (resourceTypeId == RESOURCE_NUMBERING)}
            type="primary">{BUTTON_ADD_LABEL}</Button>
    ];

    const dataModelDlg = useDialog({
        title: "Установка пароля пользователя",
        content: <ModelViewerForm />,
        width:isMobile()?"100vw":"calc(100vw - 180px)",
        idName: ID_NAME
    });

    const dataModel = (ev, record) => {
        console.log(ev, record)
        ev.domEvent.stopPropagation(); // чтобы предовратить запуск окна редактирования
        dataModelDlg({
            id: {
                artifactId: record['artifactId'],
                version: 1
            },
            uriForGetOne: URI_FOR_GET_MODEL,
            title: "Просмотрщик моделей",
        });
    }

    const recordMenu = (config, record, modalConfig) => (
        <React.Fragment>
            {buildEntityPrintMenu(ENTITY, record, config)}
            {buildRecordMenuHandler(modalConfig, config, record)}
            {config.resourceTypeId == CapResources.RESOURCE_DATAMODEL
                ? <>
                    <Menu.Divider />
                    <Menu.Item key="dataModel" icon={<DatabaseOutlined />}
                               onClick={(ev) => dataModel(ev, record)}>
                        Просмотрщик моделей
                    </Menu.Item>
                </>
                : ""
            }
        </React.Fragment>
    )

    if (menuCommand) {
        buttons.push(<Dropdown.Button key="more"
            className="more-dropbutton"
            trigger="click"
            overlay={menuCommand} icon={<MoreOutlined />} />);
    }
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
                        title={MOD_TITLE}
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
                    tableInterface.requestParams.filters.resourceTypeId = +resourceTypeId;
                    return true;
                }}
                onAfterRefresh={() => setUpdateRecords([])}
                updateRecords={updateRecords}
                recordMenu={(record) => recordMenu({
                    form,
                    idName: ID_NAME,
                    resourceTypeId: resourceTypeId
                }, record, {
                    'topLayer': topLayer,
                    'setTopLayer': setTopLayer,
                    'form': form,
                    'tableInterface': tableInterface,
                    'destroyDialog': (dlgId) => {
                        // нужно через timeout так как после вызова destroyDialog следуют обращения к state
                        setTimeout(() => { setTopLayer([...topLayer.filter(c => c.props.id != dlgId)]) }, 100)
                    }
                })}
                idName={ID_NAME}
            />
            <EditForm
                id={EDIT_FORM_ID}
                copyButtonFlag={true}
                visible={formVisible}
                form={form}
                width={688}
                height={520}
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
                {buildForm(form, resourceTypeId)}
            </EditForm>
            {topLayer.map(item => item)}
        </ModernApp>
    )
}

export default withRouter(CapResource);
