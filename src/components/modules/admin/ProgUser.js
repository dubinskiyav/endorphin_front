import React, { useEffect } from 'react';
import { Button, Menu, Dropdown, Form, Tag} from 'antd';
import DataTable from "../../lib/DataTable";
import ModernApp from '../../App2'
import ModuleHeader from "../../lib/ModuleHeader";
import {FilterPanelExt} from "../../lib/FilterPanelExt";
import { FilterButton}  from '../../lib/FilterButton';
import { withRouter } from "react-router";
import { BUTTON_ADD_LABEL, BUTTON_DEL_LABEL, BUTTON_REFRESH_LABEL, DEFAULT_TABLE_CONTEXT } from "../../lib/Const";
import { MoreOutlined, UsergroupAddOutlined,KeyOutlined } from '@ant-design/icons';
import { buildURL } from "../../lib/Utils";
import EditForm from "../../lib/EditForm";
import ProgUserForm from "./ProgUserForm";
import { CONTOUR_ADMIN, MODULE_CREDENTIAL } from "../../lib/ModuleConst";
import { buildPrintMenu, buildEntityPrintMenu } from '../../lib/stddialogs/PrintDialog';
import { ManageAccessRoleForm } from "./ManageAccessRoleForm";
import { SetPasswordProgUserForm } from "./SetPasswordProgUserForm";
import {responsiveMobileColumn, isMobile} from '../../lib/Responsive';
import DataSelect from "../../lib/DataSelect";
import { AppAffix } from "../../lib/AppAffix";
import {useDialog} from '../../lib/Dialogs';
import requestToAPI from '../../lib/Request';
import UserTagsSelect from './UserTagsSelect';

const MOD_TITLE = "Пользователи";
const CONTOUR = CONTOUR_ADMIN;
const MODULE = MODULE_CREDENTIAL;
const CAPCLASS_USER_TAG = 101;

// Сущность
const ENTITY = "Proguser";
// URI для использования формой со списком (текущей) и формой добавления/изменения
const URI_FOR_GET_LIST = buildURL(CONTOUR, MODULE, ENTITY) + "/getlist";
const URI_FOR_GET_ONE = buildURL(CONTOUR, MODULE, ENTITY) + "/get";
const URI_FOR_SAVE = buildURL(CONTOUR, MODULE, ENTITY) + "/save";
const URI_FOR_DELETE = buildURL(CONTOUR, MODULE, ENTITY) + "/delete";
const URI_FOR_SET_PSWD = buildURL(CONTOUR, MODULE, ENTITY) + "/setpswd";

// автоматическое обновление при монтировании компонента
const AUTO_REFRESH = true;

const userAllTags = {};

// колонки в таблице
const COLUMNS = [
    {
        title: 'Статус',
        dataIndex: 'statusDisplay',
        sorter: true,
        width: "90px",
        responsive:responsiveMobileColumn()
    },
    {
        title: 'Имя (логин)',
        dataIndex: 'proguserName',
        sorter: true,
        ellipsis: true,
        defaultSortOrder: 'ascend',
        render:(value,record)=>{
            return <>
                <div>{value} {
                    record.proguserTagIds
                        .map(id=>userAllTags[id])
                        .filter(t=>!!t)
                        .map(t=><Tag key={"k"+t.capClassCode} title={t.capClassName} color={t.htmlColor}>{t.capClassCode}</Tag>)
                    }
                </div>
            </>
        }
    },
    {
        title: 'Полное имя',
        dataIndex: 'proguserFullname',
        sorter: true,
        ellipsis: true,
        responsive:responsiveMobileColumn()
    },
    {
        title: 'E-mail',
        dataIndex: 'proguserchannelAddress',
        sorter: true,
        ellipsis: true,
        responsive:responsiveMobileColumn()
    }
]

// Уникальный идентификатор формы редактировавания
const EDIT_FORM_ID = ENTITY.toLowerCase() + "-frm";

const ID_NAME = ENTITY.charAt(0).toLowerCase() + ENTITY.slice(1) + "Id";

// Форма для редактирования
const buildForm = (form,allTags) => {
    return <ProgUserForm form={form} initialValues={{allTags}} />
}
// размер формы, -1 - по умолчанию, FORM_MAX_WIDTH - максимальная ширина
const FORM_WIDTH = -1;

// Создание компонент для фильтров
// key это уникальное имя фильтра, попадает в REST API
const buildFilters = () => {
    return <React.Fragment>
        <span>Роль</span>
        <DataSelect.AccessRoleSelect key="roleId" allowClear/>
        <span>Метки</span>
        <UserTagsSelect key="tags" tagmap={userAllTags} style={{ width: "300px" }}/>
    </React.Fragment>
}
// начальное значение фильтров
// если значение фильра не объект, а простое значение,
// то значение имени свойства компонента принимается как defaultValue компонента
const initFilters = {
}
const storeFilters = {
    roleId:{},
}

// дополнительные команды
// если меню нет, то и кнопки нет
const buildMenuCommand = (config, handleMenuClick) => {
    return <Menu onClick={handleMenuClick}>
        {buildPrintMenu(MODULE.name, config)}
    </Menu>
};

// обрабочик меню
const buildMenuHandler = () => {
    return (ev) => {
        console.log('click', ev);
    }
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
const ProgUser = (props) => {
    let [formVisible, setFormVisible] = React.useState(false);
    let [editorContext] = React.useState({
        uriForGetOne: URI_FOR_GET_ONE,
        uriForSave: URI_FOR_SAVE,
    });
    const [tableInterface] = React.useState(Object.assign({}, DEFAULT_TABLE_CONTEXT));
    const [form] = Form.useForm();
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    const [updateRecords, setUpdateRecords] = React.useState([]);
    const menuCommand = buildMenuCommand({ form: form, forceUpdateModule: forceUpdate }, buildMenuHandler());
    
    // стартовый код
    useEffect(()=>{
        // получаем список меток
        requestToAPI.post("system/capclass/getlist",{ capClassTypeId: CAPCLASS_USER_TAG, capClassBlockFlag:0})
            .then(list=>{
                list.result.map(cc=>{
                    userAllTags[cc.capClassId]=cc;
                    if(cc.capClassValue) {
                        cc.htmlColor = "#" + cc.capClassValue.toString(16).padStart(6, '0');
                    } else {
                        cc.htmlColor = "green";
                    }                    
                });
                forceUpdate();
            })
    },[])

    //== диалоги через useDialog
    const setPasswordProgUserDlg = useDialog({
        title: "Установка пароля пользователя",
        content: <SetPasswordProgUserForm />,
        width:isMobile()?"100vw":"calc(100vw - 180px)",
        idName: ID_NAME
    });

    const manageAccessRoleDlg = useDialog({
        title: "Управление ролями пользователя",
        content: <ManageAccessRoleForm />,
        width:isMobile()?"100vw":"calc(100vw - 180px)",
        idName: ID_NAME
    });

    const setPasswordProgUser = (ev, record) => {
        ev.domEvent.stopPropagation(); // чтобы предовратить запуск окна редактирования
        setPasswordProgUserDlg({
            id: record.proguserId,
            uriForSave: URI_FOR_SET_PSWD,
            title: "Установка пароля пользователя " + (record.proguserFullname || record.proguserName),
        });
    }
    const manageAccessRole = (ev, record) => {
        ev.domEvent.stopPropagation(); // чтобы предовратить запуск окна редактирования
        manageAccessRoleDlg({
            id: record.proguserId,
            uriForGetOne: buildURL(CONTOUR, MODULE, ENTITY) + "/roles/get",
            uriForSave: buildURL(CONTOUR, MODULE, ENTITY) + "/roles/save",
            title: "Управление ролями пользователя " + (record.proguserFullname || record.proguserName),
        })
    }

    // меню для записи
    const recordMenu = (config, record) => (
        <React.Fragment>
            {buildEntityPrintMenu(ENTITY, record, config)}
            <Menu.Divider />
            <Menu.Item key="manageAccessRole" icon={<UsergroupAddOutlined />} onClick={(ev) => manageAccessRole(ev, record)}>Роли</Menu.Item>
            <Menu.Item key="setPasswordProgUser" icon={<KeyOutlined/>} onClick={(ev) => setPasswordProgUser(ev, record)}>Установить пароль</Menu.Item>
        </React.Fragment>
    )


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
            disabled={tableInterface.isLoading() || tableInterface.getSelectedRows().length == 0}>{BUTTON_DEL_LABEL}</Button>,
        <Button key="refresh" onClick={() => tableInterface.refreshData()}>{BUTTON_REFRESH_LABEL}</Button>,
        <Button key="add" onClick={() => callForm()}
            type="primary">{BUTTON_ADD_LABEL}</Button>
    ];
    if (menuCommand) {
        buttons.push(<Dropdown.Button key="more"
            className="more-dropbutton"
            trigger="click"
            overlay={menuCommand} icon={<MoreOutlined />} />);
    }
    if(isMobile()) {
        const filters = buildFilters();
        buttons.push(<FilterButton key="filter" filters={filters}
                        onChange={(fc) => setFilters(fc)}
                        initValues={initFilters}/>);
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
                    <FilterPanelExt onChange={(fc) => setFilters(fc)} initValues={initFilters}  storeFilter={storeFilters}>
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
                editCallBack={(record) => callForm(record.proguserId)}
                interface={tableInterface}
                onSelectedChange={() => forceUpdate()}
                onAfterRefresh={() => setUpdateRecords([])}
                updateRecords={updateRecords}
                defaultFilters={initFilters}
                recordMenu={(record) => recordMenu({
                    form,
                    idName: ID_NAME
                }, record)}
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
                idName={ID_NAME}>
                    {buildForm(form,userAllTags)}
            </EditForm>
        </ModernApp>
    )
}
export default withRouter(ProgUser);
