import React from 'react';
import { Button, Menu, Dropdown, Form,Radio,notification } from 'antd';
import DataTable from "../../lib/DataTable";
import ModernApp from '../../App2'
import ModuleHeader from "../../lib/ModuleHeader";
import {FilterPanelExt} from "../../lib/FilterPanelExt";
import { FilterButton } from '../../lib/FilterButton';
import { withRouter } from "react-router";
import { BUTTON_REFRESH_LABEL, DEFAULT_TABLE_CONTEXT } from "../../lib/Const";
import { MoreOutlined,CloseSquareOutlined} from '@ant-design/icons';
import { buildURL,drawDate,DrawBoolIcon,drawDateAndTime } from "../../lib/Utils";
import { CONTOUR_ADMIN, MODULE_AUDIT} from "../../lib/ModuleConst";
import { buildPrintMenu, buildEntityPrintMenu } from '../../lib/stddialogs/PrintDialog';
import {responsiveMobileColumn, isMobile} from '../../lib/Responsive';
import DataLookup from '../../lib/DataLookup';
import requestToAPI from "../../lib/Request";
import { confirm } from "../../lib/Dialogs";
import { AppAffix } from "../../lib/AppAffix";

const MOD_TITLE = "Сессии";
const CONTOUR = CONTOUR_ADMIN;
const MODULE = MODULE_AUDIT;

// Сущность
const ENTITY = "Session";
// URI для использования формой со списком (текущей) и формой добавления/изменения
const URI_FOR_GET_LIST = buildURL(CONTOUR, MODULE, ENTITY) + "/getlist";
const URI_FOR_CLOSE_SESSION = buildURL(CONTOUR, MODULE, ENTITY) + "/close";

const IDNAME = "proguserAuthId";

// автоматическое обновление при монтировании компонента
const AUTO_REFRESH = true;

// колонки в таблице
const COLUMNS = [
    {
        title: 'Создан',
        dataIndex: 'proguserAuthDateCreate',
        sorter: true,
        defaultSortOrder: "descend",
        width: "90px",
        render: drawDateAndTime,
        renderForFilter: drawDate,
    },
    {
        title: 'Открыта',
        dataIndex: 'activeFlag',
        sorter: false,
        width: "80px",
        responsive:responsiveMobileColumn(),
        render: DrawBoolIcon,
        disableQuickFilter:true
    },
    {
        title: 'Имя',
        dataIndex: 'proguserName',
        sorter: true,
        ellipsis: true,
    },
    {
        title: 'Статус пользователя',
        dataIndex: 'statusDisplay',
        sorter: true,
        width: "120px",
        responsive:responsiveMobileColumn()
    },
    {
        title: 'Токен',
        dataIndex: 'proguserAuthToken',
        sorter: true,
        ellipsis: true,
        responsive:responsiveMobileColumn(),
    },
    {
        title: 'Дата последнего обновления',
        dataIndex: 'proguserAuthLastQuery',
        sorter: true,
        width: "120px",
        render: drawDateAndTime,
        renderForFilter: drawDate,
        responsive:responsiveMobileColumn(),
    },
    {
        title: 'Дата закрытия',
        dataIndex: 'proguserAuthDateEnd',
        sorter: true,
        width: "90px",
        render: drawDateAndTime,
        renderForFilter: drawDate,
        responsive:responsiveMobileColumn(),
    },
]

// Создание компонент для фильтров
// key это уникальное имя фильтра, попадает в REST API
const buildFilters = () => {
    return <React.Fragment>
        <Radio.Group key="status" buttonStyle="solid">
          <Radio.Button value="0">Все</Radio.Button>
          <Radio.Button value="1">Активные</Radio.Button>
          <Radio.Button value="2">Закрытые</Radio.Button>
        </Radio.Group>
        <span>Пользователь:</span>
        <DataLookup.ProgUser key="proguserId" style={{ width: 280 }} allowClear={true} />
    </React.Fragment>
}
// начальное значение фильтров
// если значение фильра не объект, а простое значение,
// то значение имени свойства компонента принимается как defaultValue компонента
const initFilters = {
    status:"0"
}
// заводские настройки
const factoryinitFilters={...initFilters}

const storeFilters = {
    status:{},
    proguserId:{}
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
const Session = (props) => {
    const [topLayer, setTopLayer] = React.useState([]);
    const [tableInterface] = React.useState(Object.assign({}, DEFAULT_TABLE_CONTEXT));
    const [form] = Form.useForm();
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    const [updateRecords, setUpdateRecords] = React.useState([]);
    const menuCommand = buildMenuCommand({ form: form, forceUpdateModule: forceUpdate }, buildMenuHandler({
        topLayer,
        setTopLayer,
        form,
        tableInterface,
        destroyDialog: (dlgId) => {
            // нужно через timeout так как после вызова destroyDialog следуют обращения к state
            setTimeout(() => { setTopLayer([...topLayer.filter(c => c.props.id != dlgId)]) }, 100)
        }
    }));


    const setFilters = React.useCallback((config) => {
        tableInterface.requestParams.filters = config;
        tableInterface.refreshData();
    }, [tableInterface])

    const closeSession = React.useCallback(() => {
        let ids = tableInterface.getSelectedRows().join(',');
        const count = tableInterface.getSelectedRows().length;
        confirm(`Уже закрытые сессии не будут затронуты. Откатить изменения не получится. Закрыть сессий в количестве ${count}?`, () => {
            requestToAPI.post(URI_FOR_CLOSE_SESSION, ids.split(","))
                .then(() => {
                    tableInterface.refreshData();
                    notification.success({ message: "Сессии закрыты" })
                })
                .catch(error => {
                    notification.error({
                        message: "Ошибка при закрытии сессий",
                        description: error.message
                    })
                })
        })
    }, [tableInterface])


    // тут формируются кнопки
    const buttons = [
        <Button key="close" onClick={closeSession} icon={<CloseSquareOutlined />}
            disabled={tableInterface.isLoading() || tableInterface.getSelectedRows().length == 0}>Закрыть</Button>,
        <Button key="refresh" type="primary" onClick={() => tableInterface.refreshData()}>{BUTTON_REFRESH_LABEL}</Button>,
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
                    <FilterPanelExt onChange={(fc) => setFilters(fc)} initValues={initFilters} storeFilter={storeFilters} factoryInitValues={factoryinitFilters}>
                        {buildFilters()}
                    </FilterPanelExt>
                </div>
            </AppAffix>
            <DataTable className="mod-main-table"
                uri={{
                    forSelect: URI_FOR_GET_LIST,
                }}
                columns={COLUMNS}
                autoRefresh={AUTO_REFRESH}
                interface={tableInterface}
                defaultFilters={initFilters}
                editable={false}
                onSelectedChange={() => forceUpdate()}
                onAfterRefresh={() => setUpdateRecords([])}
                updateRecords={updateRecords}
                recordMenu={(record) => recordMenu({
                    topLayer,
                    setTopLayer,
                    form,
                    tableInterface,
                    idName: {IDNAME},
                    destroyDialog: (dlgId) => {
                        setTopLayer([...topLayer.filter(c => c.props.id != dlgId)])
                    }
                }, record)}
                idName={IDNAME}
            />
            {topLayer.map(item => item)}
        </ModernApp>
    )
}
export default withRouter(Session);
