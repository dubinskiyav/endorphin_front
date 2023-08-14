import * as MenuConst from '../../lib/ModuleConst'
import * as Utils from '../../lib/Utils'
import {
    SafetyCertificateOutlined,SolutionOutlined,
    AppstoreOutlined,
    CrownOutlined,
    AuditOutlined, FolderViewOutlined,
    ControlOutlined, FileOutlined,
    OneToOneOutlined,SecurityScanOutlined,TeamOutlined, SettingOutlined,HddOutlined
} from '@ant-design/icons';
import * as CapResources from "../../lib/CapResourceType";



export interface MenuItem {
    /** имя элемента в MenuConst (свойство name модуля или контура ) */
    ref?:string,
    /** алтернативный способ задать key и label */
    key?:string,
    label?:string,
    icon?:JSX.Element,
    /** uri */
    to?:string,
    /** если субменю */
    children?:MenuItem[],
    description?:string
}

/**
 * Структура главного меню
 */
export const MenuStructure:MenuItem[] = [
    {
        ref:MenuConst.CONTOUR_REFBOOKS.name,
        children:[
            {
                key:"materials",
                label:"Товарно-материальные ценности",
                icon: <AppstoreOutlined/>,
                children:[
                    {
                        key:MenuConst.MODULE_EDIZM.name + ".sm1",
                        label:MenuConst.MODULE_EDIZM.title,
                        to:"/edizm"
                    }
                ]
            },
            {
                ref:MenuConst.MODULE_PERSON.name,
                icon: <TeamOutlined />,
                children:[
                    {
                        key:MenuConst.MODULE_PERSON.name + ".sm1",
                        label:"Сотрудники",
                        to:"/person",
                        description:"Справочник сотрудников предрприятия"
                    }
                ]    
            }

        ]
    },
    {
        ref:MenuConst.CONTOUR_DOCUMENTS.name,
        children:[
            {
                key:MenuConst.MODULE_REQUEST.name,
                label:MenuConst.MODULE_REQUEST.title,
                icon:<AppstoreOutlined/>,
                children:[
                    {
                        key:MenuConst.MODULE_REQUEST.name + ".sm1",
                        label:MenuConst.MODULE_REQUEST.title,
                        to:"/testrequest"
                    },
                    {
                        key:MenuConst.MODULE_REQUEST.name + ".sm2",
                        label:"Заявки с редактированием в странице",
                        to:"/testrequest1"
                    },
                    {
                        key:MenuConst.MODULE_REQUEST.name + ".ref",
                        label:"Справочники",
                        children:[
                            {
                                key:MenuConst.MODULE_REQUEST.name + ".ref.204",
                                label:Utils.getCapClassTypeName(204),
                                to:"/capclass/204/" + MenuConst.CONTOUR_DOCUMENTS.name + "/" + MenuConst.MODULE_REQUEST.name
                            }    
                        ]
                    },
                ]
            },
        ]
    },
    {
        ref:MenuConst.CONTOUR_ADMIN.name,
        icon:<SettingOutlined/>,
        children: [
            {
                ref:MenuConst.MODULE_CREDENTIAL.name,
                icon:<SafetyCertificateOutlined />,
                children:[
                    {
                        key:MenuConst.MODULE_CREDENTIAL.name + ".sm1",
                        label:"Пользователи",
                        icon:<TeamOutlined/>,
                        to:"/proguser",
                        description:"Справочник пользователей, создание пароля, назначение ролей"
                    },
                    {
                        key:MenuConst.MODULE_CREDENTIAL.name + ".sm2",
                        label:"Роли",
                        icon:<SolutionOutlined />,
                        to:"/accessrole",
                        description:"Список ролей, видимость роли"
                    },
                    {
                        key:MenuConst.MODULE_CREDENTIAL.name + ".sm3",
                        label:"Права",
                        icon:<CrownOutlined/>,
                        to:"/controlobject",
                        description:"Определение прав ролей"
                    },
                    {
                        key:MenuConst.MODULE_CREDENTIAL.name + ".sm4",
                        label:"Доступ к модулям",
                        icon:<AppstoreOutlined/>,
                        to:"/applicationrole",
                        description:"Определение доступа к модулям в разрезе ролей"
                    },
                    {
                        key:MenuConst.MODULE_CREDENTIAL.name + ".sm5",
                        label:"Доступ к ресурсам",
                        icon:<OneToOneOutlined/>,
                        to:"/capresourcerole",
                        description:"Определение доступа к ресурсам в разрезе ролей"
                    },

                ]
            },
            {
                ref:MenuConst.MODULE_AUDIT.name,
                icon:<AuditOutlined />,
                children:[
                    {
                        key:MenuConst.MODULE_AUDIT.name + ".sm1",
                        label:"Просмотр логов",
                        icon:<FolderViewOutlined/>,
                        to:"/audit",
                        description:"Просмотр логов службы аудита"
                    },
                    {
                        key:MenuConst.MODULE_AUDIT.name + ".sm2",
                        label:"Сессии",
                        icon:<SecurityScanOutlined/>,
                        to:"/session",
                        description:"Просмотр/закрытие сессий"
                    },
                    {
                        key:MenuConst.MODULE_AUDIT.name + ".sm3",
                        label:"Логи отправки сообщений",
                        icon:<SecurityScanOutlined/>,
                        to:"/senderlog",
                        description:"Просмотр логов отправки сообщений в интеграционную шину"
                    },
                ]
            },
            {
                ref:MenuConst.MODULE_CONFIG.name,
                icon:<ControlOutlined />,
                children:[
                    {
                        key:MenuConst.MODULE_CONFIG.name + ".sm1",
                        label:"Документы",
                        icon:<FileOutlined/>,
                        to:"/document",
                        description:"Определение модели статусов документов, электронные материалы"
                    },
                    {
                        key:MenuConst.MODULE_CONFIG.name + ".resources",
                        label:"Ресурсы",
                        icon:<SettingOutlined/>,
                        children:[
                            {
                                key:MenuConst.MODULE_CONFIG.name + ".cr" + CapResources.RESOURCE_PRINTFORM,
                                label:"Печатные формы",
                                to:"/capresource/" + CapResources.RESOURCE_PRINTFORM,
                                description:"Печатные формы и их свойства"
                            },
                            {
                                key:MenuConst.MODULE_CONFIG.name + ".cr" + CapResources.RESOURCE_NUMBERING,
                                label:"Нумераторы",
                                to:"/capresource/" + CapResources.RESOURCE_NUMBERING,
                                description:"Нумераторы и их свойства"
                            },
                            {
                                key:MenuConst.MODULE_CONFIG.name + ".cr" + CapResources.RESOURCE_ATTRIBUTE,
                                label:"Признаки",
                                to:"/capresource/" + CapResources.RESOURCE_ATTRIBUTE,
                                description:"Признаки и их свойства"
                            },
                            {
                                key:MenuConst.MODULE_CONFIG.name + ".cr" + CapResources.RESOURCE_CONSTANT,
                                label:"Константы",
                                to:"/capresource/" + CapResources.RESOURCE_CONSTANT,
                                description:"Константы и их свойства"
                            },
                            {
                                key:MenuConst.MODULE_CONFIG.name + ".cr" + CapResources.RESOURCE_DATAMODEL,
                                label:"Модели данных",
                                to:"/capresource/" + CapResources.RESOURCE_DATAMODEL,
                                description:"ER-модели базы данных"
                            }                           
                        ]    
                    },
                    {
                        key:MenuConst.MODULE_CONFIG.name + ".ref",
                        label:"Справочники",
                        icon:<HddOutlined/>,
                        children:[
                            {
                                key:MenuConst.MODULE_CAPCLASS.name + ".ref.76",
                                label:Utils.getCapClassTypeName(76),
                                to:"/capclass/76/" + MenuConst.CONTOUR_ADMIN.name + "/" + MenuConst.MODULE_CONFIG.name,
                                description:"Типы электронных материалов, добавление, изменение, удаление и блокировка"
                            },
                            {
                                key:MenuConst.MODULE_CAPCLASS.name + ".ref.101",
                                label:Utils.getCapClassTypeName(101),
                                to:"/capclasslabel/101/" + MenuConst.CONTOUR_ADMIN.name + "/" + MenuConst.MODULE_CONFIG.name,
                                description:"Типы меток пользователя, добавление, изменение, удаление и блокировка"
                            }                                 
                        ]    
                    },

                ]
            },
        

        ]
    },
]

