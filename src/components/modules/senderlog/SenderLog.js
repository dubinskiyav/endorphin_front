import React from 'react';
import {Button, Menu, Dropdown, Form, InputNumber, notification, Radio, Tooltip, Statistic} from 'antd';
import DataTable from "../../lib/DataTable";
import ModernApp from '../../App2'
import ModuleHeader from "../../lib/ModuleHeader";
import  { FilterPanelExt } from "../../lib/FilterPanelExt";
import { FilterButton } from '../../lib/FilterButton';
import { withRouter } from "react-router";
import {
    BUTTON_DEL_LABEL,
    BUTTON_REFRESH_LABEL, BUTTON_RESEND_LABEL, DEFAULT_TABLE_CONTEXT
} from "../../lib/Const";
import {
    SendOutlined,
    MoreOutlined,
    ExclamationCircleOutlined,
    MailOutlined, CheckOutlined
} from '@ant-design/icons';
import { buildURL, drawDateAndTime } from "../../lib/Utils";
import EditForm from "../../lib/EditForm";
import { CONTOUR_ADMIN, MODULE_AUDIT } from "../../lib/ModuleConst"
import { buildPrintMenu, buildEntityPrintMenu } from '../../lib/stddialogs/PrintDialog';
import SenderLogForm from './SenderLogForm';
import 'moment-duration-format';
import { responsiveMobileColumn, isMobile } from '../../lib/Responsive';
import { AppAffix } from "../../lib/AppAffix";
import DataSelect from "../../lib/DataSelect";
import {confirm} from "../../lib/Dialogs";
import requestToAPI from "../../lib/Request";

const { Countdown } = Statistic;

const MOD_TITLE = "Отправка сообщений";
const CONTOUR = CONTOUR_ADMIN;
const MODULE = MODULE_AUDIT;

// Сущность (в CamelCase)
const ENTITY = "senderlog";
// URI для использования формой со списком (текущей) и формой добавления/изменения
const URI_FOR_GET_LIST = buildURL(CONTOUR, MODULE, ENTITY) + "/getlist";
const URI_FOR_GET_ONE = buildURL(CONTOUR, MODULE, ENTITY) + "/get";
const URI_FOR_DELETE = buildURL(CONTOUR, MODULE, ENTITY) + "/delete";
const URI_FOR_RESEND = buildURL(CONTOUR, MODULE, ENTITY) + "/resend";

const ID_NAME = "senderLogId";

// автоматическое обновление при монтировании компонента
const AUTO_REFRESH = true;

export const STATUS_ICON = {
    '0':  <CheckOutlined />,
    '1': <MailOutlined />,
    '2': <ExclamationCircleOutlined />,
}

export const STATUS_LABEL = {
    '0': "Сообщение успешно отправлено",
    '1': "Ответ на сообщение получен",
    '2': "При отправке сообщения возникла ошибка",
}

// колонки в таблице
const COLUMNS = [
    {
        title: 'Дата/время включения в очередь',
        dataIndex: 'senderLogDateTime',
        sorter: true,
        defaultSortOrder: "descend",
        render: drawDateAndTime,
        renderForFilter: drawDateAndTime,
        disableQuickFilter:true,
        width:"140px",
    },
    {
        title: 'Тип сообщения',
        dataIndex: 'senderLogTypeName',
        sorter: true,
        ellipsis: true,
        disableQuickFilter:true,
    },
    {
        title: 'Статус',
        ellipsis: true,
        dataIndex: 'senderLogStatus',
        sorter: false,
        responsive: responsiveMobileColumn(),
        disableQuickFilter:true,
        width:"80px",
        render: (value) => {
            if(value===undefined) {
                return ""
            }
            return <div title={STATUS_LABEL[value]}>{STATUS_ICON[value]}</div>
        }
    },
    {
        title: 'Сообщение об ошибке',
        dataIndex: 'senderLogErrorMessage',
        ellipsis: true,
        sorter: false,
        responsive: responsiveMobileColumn()
    }
]

// Уникальный идентификатор формы редактировавания
const EDIT_FORM_ID = ENTITY.toLowerCase() + "-frm";
// Форма для редактирования
const buildForm = (form) => {
    return <SenderLogForm form={form} initialValues={{}} />
}

// key это уникальное имя фильтра, попадает в REST API
const buildFilters = () => {
    return <React.Fragment>
        <span>Тип сообщения:</span>
        <DataSelect.CapCodeSelect key="senderLogTypeId" allowClear={true} capCodeType={2153} />
        <span>Статус:</span>
        <Radio.Group key="senderLogStatus" buttonStyle="solid">
            <Radio.Button value="-1">Все</Radio.Button>
            <Tooltip placement="top" title={'Сообщение успешно отправлено'}>
                <Radio.Button value="0"><CheckOutlined /></Radio.Button>
            </Tooltip>
            <Tooltip placement="top" title={'Ответ на сообщение получен'}>
                <Radio.Button value="1" ><MailOutlined /></Radio.Button>
            </Tooltip>
            <Tooltip placement="top" title={'При отправке сообщения возникла ошибка'}>
                <Radio.Button value="2"><ExclamationCircleOutlined /></Radio.Button>
            </Tooltip>
        </Radio.Group>
    </React.Fragment>
}
// начальное значение фильтров
// если значение фильра не объект, а простое значение,
// то имя свойства компонента принимается defaultValue
const initFilters = {
    senderLogStatus:-1    
}
// заводские настройки
const factoryinitFilters={...initFilters}

const storeFilters = {
    senderLogTypeId:{},
    senderLogStatus:{}
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
    }
}


// меню записи
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
const SenderLog = (props) => {
    let [formVisible, setFormVisible] = React.useState(false);
    let [editorContext] = React.useState({
        uriForGetOne: URI_FOR_GET_ONE
    });
    const [tableInterface] = React.useState(Object.assign({}, DEFAULT_TABLE_CONTEXT));
    const [form] = Form.useForm();
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    const [updateRecords, setUpdateRecords] = React.useState([]);
    const menuCommand = buildMenuCommand({ form: form, forceUpdateModule: forceUpdate }, buildMenuHandler());
    // размер формы, -1 - по умолчанию, FORM_MAX_WIDTH - максимальная ширина
    const FORM_WIDTH = isMobile() ? -1 : "60%";

    const setFilters = React.useCallback((config) => {
        tableInterface.requestParams.filters = config;
        tableInterface.refreshData();
    }, [tableInterface])


    const callForm = React.useCallback((id) => {
        editorContext.id = id;
        setFormVisible(true);
    }, [editorContext])

    const sendLog = React.useCallback(() => {
        let ids = tableInterface.getSelectedRows().join(',');
        const count = tableInterface.getSelectedRows().length;
        confirm(`Отправить сообщения повторно в количестве: ${count}?`, () => {
            requestToAPI.post(URI_FOR_RESEND, ids.split(","))
                .then(() => {
                    notification.success({ 
                        message:<div>Сообщения отправлены. Обновим через 
                            <Countdown value={Date.now() + 5 * 1000} onFinish={()=>tableInterface.refreshData()} />
                                </div>,
                        duration:5.5
                    })                        
                })
                .catch(error => {
                    notification.error({
                        message: "Ошибка при отправке сообщений",
                        description: error.message
                    })
                })
        })
    }, [tableInterface])

    // тут формируются кнопки
    const buttons = [
        <Button key="send" onClick={sendLog} icon={<SendOutlined/>}
                disabled={tableInterface.isLoading() || tableInterface.getSelectedRows().length == 0}>{BUTTON_RESEND_LABEL}</Button>,
        <Button key="del" onClick={() => tableInterface.deleteData()}
                disabled={tableInterface.isLoading() || tableInterface.getSelectedRows().length == 0}>{BUTTON_DEL_LABEL}</Button>,
        <Button key="refresh" onClick={() => tableInterface.refreshData()}>{BUTTON_REFRESH_LABEL}</Button>,
    ];
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

    return (
        <ModernApp buttons={buttons}>
            <AppAffix>
                <div>
                    <ModuleHeader
                        title={MOD_TITLE}
                        onSearch={value => {
                            tableInterface.requestParams.search = value ? value : undefined;
                            tableInterface.refreshData();
                        }}
                        buttons={buttons}
                    />
                    <FilterPanelExt onChange={(fc) => setFilters(fc)} initValues={initFilters} 
                        storeFilter={storeFilters} factoryInitValues={factoryinitFilters}>
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
                rowClassName={(record, index) =>record.faultInfo?'audit-table-fault':undefined}
                autoRefresh={AUTO_REFRESH}
                editCallBack={(record) => callForm(record[ID_NAME])}
                interface={tableInterface}
                onSelectedChange={() => forceUpdate()}
                onBeforeRefresh={(requestParams)=>{
                    // convert, так как в initFilters задается строкой, поэтому облом в начальный момент
                    if(requestParams.filters.senderLogStatus) {
                        requestParams.filters.senderLogStatus=parseInt(requestParams.filters.senderLogStatus);
                    }
                    return true;
                }}
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
                title={"Запись в очереди отправки"}
                visible={formVisible}
                form={form}
                width={FORM_WIDTH}
                editorContext={editorContext}
                afterSave={(response) => {
                    setFormVisible(false);
                }}
                afterCancel={() => {
                    setFormVisible(false);
                }}
                idName={ID_NAME}
            >
                {buildForm(form)}
            </EditForm>
        </ModernApp>
    )
}
export default withRouter(SenderLog);
