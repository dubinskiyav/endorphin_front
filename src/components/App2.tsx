import React, { useEffect, useState } from 'react'
import { Link,useHistory } from 'react-router-dom';
import withStyles,{WithStylesProps} from 'react-jss'
import { useMediaQuery } from 'react-responsive'


import {Affix, BackTop, Button, Divider, Drawer, Form, Menu, Popover} from 'antd';
import { HomeOutlined, UserOutlined,
    CloseOutlined,MenuOutlined,IdcardOutlined,BankOutlined } from '@ant-design/icons';

import * as Utils from './lib/Utils';
import * as ModuleConst from './lib/ModuleConst';
import * as StyleConst from './lib/StyleConst';
import {MenuStructure,MenuItem} from './modules/home/menu';
import { DesktopOrTabletScreen,MobileScreen, setMobile } from './lib/Responsive';
import requestToAPI from './lib/Request';
import { logout, restoreToken } from "./lib/LoginForm";
import {TopLayer, useDialog} from './lib/Dialogs';
import {ChangePasswordForm} from './lib/ChangePasswordForm';
import { Manifest, retrieveManifest } from './lib/Manifest';
import { UserMenu } from './lib/UserMenu';
import LazyLoader from './lib/LazyLoader'

const URI_FOR_CHANGE_PSWD = Utils.buildURL(ModuleConst.CONTOUR_ADMIN, ModuleConst.MODULE_CREDENTIAL, "proguser") + "/changepswd";

export interface Module {
    applicationCode: string,
    applicationDesc: string
    applicationExe: string
    applicationId: number,
    applicationName: string,
    applicationType: number
}

export interface ItemDesc {
    name:string,
    title:string,
    icon?:JSX.Element,
    description?:string,
    order?:number
}

// JSS. Стили компонента
const styles = {
    notext:{
        '& span.ant-menu-title-content':{
            marginLeft:0
        }
    },
    content:{
        padding:"0 20px"
    },
    popover:{
        '& .ant-popover-inner':{
            whiteSpace:"nowrap"
        },
    },
    usermenu:{
        borderWidth:"0px"
    },
    actionbar: {
        borderBottom: '1px solid #eee',
        backgroundColor: StyleConst.MOB_ACTION_BAR_COLOR,
    },
    actionbarfordesktop:{
        backgroundColor: StyleConst.DESKTOP_ACTION_BAR_COLOR
    },
    padding8: {
        padding: '8px',
    },
    drawer: {
        "& .ant-drawer-body":{
            padding: "0px"
        },
        "& ant-drawer-header":{
            paddingRight: '8px'
        },
        "& .ant-drawer-title": {
            lineHeight:2.0
        }
    },
    flat_button:{
        backgroundColor: 'transparent',
        border: '0px',
    },
    ralign: {
        float:"right",
        marginRight: "-16px"
    },
    drawer_button:{
        backgroundColor: 'transparent',
        border: '0px',
        float:"left"
    },
    colorwhite:{
        color: 'white',
    },
    user_menu_item:{
        marginLeft: 'auto',
    },
    popoverOverlay:{
        '& .ant-popover-arrow':{
            right:'6px'
        }
    }
}

export const getModuleTitleByRef=(ref?:string):string => {
    return ref?(ModuleConst.CONTOURS as any)[ref]??(ModuleConst.MODULES as any)[ref]??"?":"?";
}

export const getAllowModules = () => {
    return JSON.parse(Utils.getItemFromLocalStorage("modules") ?? "[]") as Module[];
};

// спецификация пропсов
interface ComponentProps extends WithStylesProps<typeof styles> {
    children: React.ReactNode,
    getAllowContours?:(contours:ItemDesc[])=>void,
    afterLogout?:()=>void,
    buttons?:React.ReactNode[],
    homePage?:boolean
}


const ModernApp:React.FC<ComponentProps> = ({children,classes,getAllowContours,afterLogout,buttons,homePage}) => {

    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    // Получим список всех доступных пользовaтелю модулей
    const [allowModules] = useState(getAllowModules());
    var [visibleUserPopover, setVisibleUserPopover] = useState(false);
    const [visibleMobileMenu, setVisibleMobileMenu] = React.useState(false);
    const [contours,setCountours] = useState<ItemDesc[]>([]);
    const [form] = Form.useForm();

    useState(()=>{
        restoreToken();
    })
    const history = useHistory();

    const changePasswordDlg = useDialog({
        title: "Сменить пароль пользователя",
        content: <ChangePasswordForm form={form} />,
        width:"calc(100vw - 180px)",
        idName: "userName"
    });

    const [manifest, setManifest] = React.useState<Manifest>();

    // получим манифест
    retrieveManifest((man)=>setManifest(man),manifest);

    // выделим контуры
    useEffect(()=>{
        const moduleIndex = allowModules.map((value:Module) => value.applicationExe.toLowerCase());
        const allowContours: ItemDesc[] = [];
        ModuleConst.CONTOURS_WITH_MODULES.forEach((modules:ItemDesc[],contour:ItemDesc) => {
            if(!allowContours.find(c=>c.name==contour.name)) {
                if(modules.find((mod:ItemDesc)=>moduleIndex.indexOf(mod.name)>=0)) {
                    allowContours.push(contour);
                }
            }
        });
        allowContours.forEach(i=>i.order = i.order || 999);
        allowContours.sort((i1:any,i2:any)=>
            i1.order > i2.order?1:i1.order == i2.order?0:-1
        );
        setCountours(allowContours);
        // сделаем обратный вызов, если есть интерес к спискку активных контуров
        if(getAllowContours) {
            getAllowContours(allowContours);
        }
    },[allowModules,getAllowContours])

    const enumMenuItem = (root:MenuItem):JSX.Element => {
        return root.children?
                <Menu.SubMenu key={root.key??root.ref} icon={root.icon} title={root.label??getModuleTitleByRef(root.ref)}>
                        {root.children.map(childItem=>enumMenuItem(childItem))}
                </Menu.SubMenu>
               :<Menu.Item key={root.key??root.ref} icon={root.icon}>
                        <Link to={root.to??"/"}>
                            {root.label??getModuleTitleByRef(root.ref)}
                        </Link>
                </Menu.Item>
    }

    const getModules = (c: ItemDesc): React.ReactNode => {
        const rootItem:MenuItem = MenuStructure.filter((itm:MenuItem)=>itm.ref==c.name)[0];
        if(!rootItem) {
            return;
        }
        return enumMenuItem(rootItem);
    }

    const userTitle = React.useCallback(() => {
        if (!requestToAPI.user) {
            return "";
        }
        return <div style={{ padding: 16 }}>
            <div style={{marginBottom:8}}><span><UserOutlined /> {(requestToAPI.user as any).name}</span></div>
            <LazyLoader key="user-properties" rows={2}
                promise={() => (
                    requestToAPI.post("admin/credential/proguser/properties",{})
                        .then((response: any) =>{
                            return <>
                                {
                                    response.worker?
                                    <div><span><IdcardOutlined title='Связан с сотрудником' /> {response.worker.fio}</span></div>
                                    :undefined
                                }
                                {
                                    response.subject?
                                    <div><span><BankOutlined title='Связан с объектом' /> {response.subject.subjectName}</span></div>
                                    :undefined
                                }
                            </>
                        }))}/>
        </div>
    }, [])

    const logoutHandle = React.useCallback(() => {
        setVisibleUserPopover(false);
        logout(history, afterLogout??forceUpdate);
    }, [setVisibleUserPopover, history, forceUpdate,afterLogout])

    const changePasswordHandle = React.useCallback(() => {
        setVisibleUserPopover(false);
        console.log(123123)
        changePasswordDlg({
            id: typeof requestToAPI.user!["name"] === "string" || typeof requestToAPI.user!["name"] === "number"
                ? requestToAPI.user!["name"] : undefined,
            uriForSave: URI_FOR_CHANGE_PSWD
        });
    },[changePasswordDlg])

    setMobile(useMediaQuery({query:"(max-width:767px)"}));
    // проверяем наличие сохраненного токен
    const savedToken = !!(sessionStorage.getItem("token") ?? localStorage.getItem("token"));

    return (
        <div>
            <DesktopOrTabletScreen>
                <Affix offsetTop={0}>
                    <Menu mode="horizontal" selectable={false} className={classes.actionbarfordesktop}>
                        <Menu.Item key={"home"} icon={<HomeOutlined />} className={classes.notext}>
                            <Link to={"/"}></Link>
                        </Menu.Item>
                        {contours.map(c=>getModules(c))}
                        {
                            requestToAPI.token || savedToken?
                            <Menu.Item key={"account"} icon={<UserOutlined />}
                                    onClick={()=>setVisibleUserPopover(!visibleUserPopover)}
                                    className={classes.notext+" "+classes.user_menu_item}>
                                <Popover
                                    className={classes.popover}
                                    visible={visibleUserPopover}
                                    onVisibleChange={(newOpen) => {setVisibleUserPopover(newOpen)}}
                                    placement="bottomRight"
                                    trigger="click"
                                    title={userTitle()}
                                    overlayClassName={classes.popoverOverlay}
                                    content={<UserMenu changePasswordHandle={changePasswordHandle} logoutHandle={logoutHandle}/>}>
                                        &nbsp;
                                </Popover>
                            </Menu.Item>
                            :undefined
                        }
                    </Menu>
                </Affix>
                <BackTop />
            </DesktopOrTabletScreen>
            <MobileScreen>
                <Affix offsetTop={0}>
                    <div className={classes.padding8+" "+(homePage?"":classes.actionbar)}>
                        <Button className={classes.drawer_button+" "+(!homePage?classes.colorwhite:"") } shape="circle" icon={<MenuOutlined />}
                            onClick={() => setVisibleMobileMenu(true)} />
                        {Utils.buildMobileButtons(buttons)}
                    </div>
                </Affix>
                {/* @ts-ignore :bug antd Drawer not content children */}
                <Drawer
                    className={classes.drawer}
                    title={<div>
                        {manifest?manifest.name:""}
                        <div className={classes.ralign}>
                            <Button shape="circle" className={classes.flat_button}
                                icon={<HomeOutlined />}
                                onClick={() => {
                                    setVisibleMobileMenu(false);
                                    history.push("/");
                                }}/>
                            &nbsp;&nbsp;
                            <Button shape="circle" className={classes.flat_button}
                                icon={<CloseOutlined />}
                                onClick={() => setVisibleMobileMenu(false)} />
                        </div>
                    </div>}
                    placement={"left"}
                    closable={false}
                    visible={visibleMobileMenu}
                    onClose={() => setVisibleMobileMenu(false)}
                >
                    <Menu mode="inline">
                        {contours.map(c=>getModules(c))}
                    </Menu>
                    <Divider/>
                    <div style={{paddingLeft:8}}>
                        <UserMenu changePasswordHandle={changePasswordHandle} logoutHandle={logoutHandle}/>
                    </div>
                </Drawer>
            </MobileScreen>
            <div className={classes.content}>
                {children}
            </div>
            <TopLayer/>
        </div>
    )
}

export default withStyles(styles)(ModernApp)



