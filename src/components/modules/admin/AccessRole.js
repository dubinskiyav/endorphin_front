import React from 'react';
import { Button, Menu, Dropdown, Form, notification } from 'antd';
import DataTable from "../../lib/DataTable";
import ModernApp from '../../App2'
import ModuleHeader from "../../lib/ModuleHeader";
import { withRouter } from "react-router";
import { BUTTON_ADD_LABEL, BUTTON_DEL_LABEL, BUTTON_REFRESH_LABEL, DEFAULT_TABLE_CONTEXT } from "../../lib/Const";
import { MoreOutlined,ExportOutlined,ImportOutlined } from '@ant-design/icons';
import { DrawBoolIcon, buildURL } from "../../lib/Utils";
import EditForm from "../../lib/EditForm";
import AccessRoleForm from "./AccessRoleForm";
import { CONTOUR_ADMIN, MODULE_CREDENTIAL } from "../../lib/ModuleConst"
import { buildPrintMenu, buildEntityPrintMenu } from '../../lib/stddialogs/PrintDialog';
import {responsiveMobileColumn} from '../../lib/Responsive';
import requestToAPI from "../../lib/Request";
import FileSaver from 'file-saver';
import moment from 'moment';
import { AppAffix } from "../../lib/AppAffix";

const MOD_TITLE = "Роли";
const CONTOUR = CONTOUR_ADMIN;
const MODULE = MODULE_CREDENTIAL;

// Сущность (в CamelCase)
const ENTITY = "AccessRole";
// URI для использования формой со списком (текущей) и формой добавления/изменения
const URI_FOR_GET_LIST = buildURL(CONTOUR, MODULE, ENTITY) + "/getlist";
const URI_FOR_GET_ONE = buildURL(CONTOUR, MODULE, ENTITY) + "/get";
const URI_FOR_SAVE = buildURL(CONTOUR, MODULE, ENTITY) + "/save";
const URI_FOR_DELETE = buildURL(CONTOUR, MODULE, ENTITY) + "/delete";

// автоматическое обновление при монтировании компонента
const AUTO_REFRESH = true;

// колонки в таблице
const COLUMNS = [
    {
        title: 'Наименование',
        dataIndex: 'accessRoleName',
        sorter: true,
        ellipsis: true,
        defaultSortOrder: 'ascend',
    },
    {
        title: 'Описание',
        dataIndex: 'accessRoleNote',
        sorter: true,
        ellipsis: true,
        responsive:responsiveMobileColumn()
    },
    {
        title: 'Видимость',
        dataIndex: 'accessRoleVisible',
        render: DrawBoolIcon,
        sorter: true,
    }
]

// Уникальный идентификатор формы редактировавания
const EDIT_FORM_ID = ENTITY.toLowerCase() + "-frm";
// Форма для редактирования
const buildForm = (form) => {
    return <AccessRoleForm form={form} initialValues={{}} />
}
// размер формы, -1 - по умолчанию, FORM_MAX_WIDTH - максимальная ширина
const FORM_WIDTH = -1;

const exportRoles = (ids)=>{
    requestToAPI.post("admin/credential/admintoolbox/accessrole/download", ids)
    .then(response => {
        console.log(response);
        let blob = new Blob([JSON.stringify(response)], { type: 'application/json' });
        FileSaver.saveAs(blob, "access_roles_"+moment().format("DD_MM_YYYY_HH_mm"));
    })
    .catch((error) => {
        notification.error({
            message: "Ошибка экспорта прав",
            description: error.message,
        })
    })

}

const importRoles = ()=>{
    var input = document.createElement('input');
    input.type = 'file';

    input.onchange = e => {
       var file = e.target.files[0];
       console.log("file",file);
       const formData = new FormData();
       formData.append("upload",file);
       requestToAPI.post(`admin/credential/admintoolbox/accessrole/upload`,
                       formData,{
                           noStringify:true,
                           noContentType:true
                       })
        .then(response => {
            notification.success({
                message: "Импортирование прав выполено успешно",
            })
        })
        .catch((error) => {
            notification.error({
                message: "Ошибка экспорта прав",
                description: error.message,
            })
        })
    }

    input.click();
}

// дополнительные команды
// если меню нет, то и кнопки нет
const buildMenuCommand = (config, handleMenuClick) => {
    const disabled = config.tableInterface.isLoading() || config.tableInterface.getSelectedRows().length == 0;
    return <Menu onClick={handleMenuClick}>
        {buildPrintMenu(MODULE.name, config)}
        <Menu.Divider />
        <Menu.Item key="export" disabled={disabled} icon={<ExportOutlined />}>Экспортировать права</Menu.Item>
        <Menu.Item key="import" icon={<ImportOutlined />}>Импортировать права...</Menu.Item>
    </Menu>
};


// обрабочик меню
const buildMenuHandler = (config) => {
    return (ev) => {
        ev.domEvent.stopPropagation();
        switch (ev.key) {
            case "export":
                exportRoles(config.tableInterface.getSelectedRows());
                break;
            case "import":
                importRoles();
                break;
            default:
        }
    }
}


// меню для записи
const recordMenu = (config, record) => (
    <React.Fragment>
        {buildEntityPrintMenu(ENTITY, record, config)}
    </React.Fragment>
)

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
const AccessRole = (props) => {
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
    const menuCommand = buildMenuCommand({ form, forceUpdateModule: forceUpdate,tableInterface }, buildMenuHandler({
        topLayer,
        setTopLayer,
        form,
        tableInterface,
        destroyDialog: (dlgId) => {
            setTopLayer([...topLayer.filter(c => c.props.id != dlgId)])
        }
    }));

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
                </div>
            </AppAffix>
            <DataTable className="mod-main-table"
                uri={{
                    forSelect: URI_FOR_GET_LIST,
                    forDelete: URI_FOR_DELETE
                }}
                columns={COLUMNS}
                autoRefresh={AUTO_REFRESH}
                editCallBack={(record) => callForm(record.accessRoleId)}
                interface={tableInterface}
                onSelectedChange={() => forceUpdate()}
                onAfterRefresh={() => setUpdateRecords([])}
                updateRecords={updateRecords}
                recordMenu={recordMenu}
                idName="accessRoleId"
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
                idName={ENTITY.charAt(0).toLowerCase() + ENTITY.slice(1) + "Id"}>
                {buildForm(form)}
            </EditForm>
            {topLayer.map(item => item)}
        </ModernApp>
    )
}
export default withRouter(AccessRole);
