import * as React from 'react'
import withStyles,{WithStylesProps} from 'react-jss'
import { Link } from 'react-router-dom';
import { useHistory } from "react-router-dom";

import ModernApp, { ItemDesc, getModuleTitleByRef } from '../../App2'
import { Row, Col, Card } from 'antd'
import {MenuStructure,MenuItem} from './menu';
import { Icon, Manifest, retrieveManifest } from '../../lib/Manifest';
import {isMobile} from '../../lib/Responsive'
import requestToAPI from '../../lib/Request';

import { LoginContent } from "../../lib/LoginForm";
import { SetPasswordContent } from "../../lib/SetPasswordForm";
import { ForgetPassword } from "../../lib/ForgetPassword";

// JSS. Стили компонента
const styles = {
    row:{
        '@media (max-width: 767px)': {
            padding:"0 0"
        },
        padding:"0 20%"
    },
    app:{
        marginTop:"8px",
        "& div.desc":{
            fontSize:"smaller",
            color: "#888"
        }
    },
    card:{
        "& .ant-card-body":{
            paddingTop:"0px",
            paddingBottom:"16px"
        }
    },
    logo:{
        width:"32px"
    },
    header:{
        marginTop: '0.5em'
    },
    form_login:{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    }
}

// содержимое окна входа
const SignupContent = (props:any)=>{
    const [controlCase, setControlCase] = React.useState("");
    const [userName, setUserName] = React.useState("");

    switch (controlCase) {
        case "tempPass":
            return <SetPasswordContent cb={props.cb} userName={userName}/>;
        case "forgetPass":
            return <ForgetPassword setControlCase={setControlCase}/>
        default:
            return <LoginContent cb={props.cb} setControlCase={setControlCase} setUserName={setUserName}/>
    }
}


declare module 'react' {
    interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
        align?: string;
    }
}

// спецификация пропсов
interface ComponentProps extends WithStylesProps<typeof styles> {
}    

const HomeImpl:React.FC<ComponentProps> = ({classes}) => {

    const [, forceUpdate] = React.useReducer(x => x + 1, 0);    
    const [allowContours, setAllowContours] = React.useState<ItemDesc[]>([]);
    const [manifest, setManifest] = React.useState<Manifest>();
    const history = useHistory();

    // получим манифест
    retrieveManifest((man)=>setManifest(man),manifest);

    const enumMenuItem = (root:MenuItem, list:MenuItem[]) => {
        if(root) {
            return root.children?root.children.forEach(childItem=>{enumMenuItem(childItem,list)})
               :list.push(root);
        };       
    }

    const buildCard = (contour:ItemDesc)=> {
        const rootItem:MenuItem = MenuStructure.filter((itm:MenuItem)=>itm.ref==contour.name)[0];
        if(!rootItem) {
            return;
        }

        const listModuleItems:MenuItem[] = [];
        // подбираем в listModules, все что запускается
        enumMenuItem(rootItem,listModuleItems);
        
        const wideflag = listModuleItems.length>5;

        const buildMenuItem = (m:MenuItem)=>{
            return <Col key={m.key} className={classes.app} span={wideflag?12:24}>
                <Link to={m.to??"/"}>
                    {m.icon} {m.label??getModuleTitleByRef(m.ref)}
                </Link>
                <div className='desc'>{m.description}</div>
            </Col>
        }
        return <Col key={contour.name} span={wideflag?24:12}>
            <Card title={<>{rootItem.icon} {contour.title}</>} className={classes.card}>
                <Row gutter={[16,16]}>
                    {listModuleItems.map(m=>buildMenuItem(m))}
                </Row>
            </Card>
        </Col>
    }

    const allowContourHandle = React.useCallback((contours:ItemDesc[]) => {
        setAllowContours(contours)
    },[setAllowContours])    

    const currentIcon:Icon = manifest && manifest.icons?manifest.icons[manifest.icons.length-1]:{};

    // проверяем наличие сохраненного токен
    const savedToken = !!(sessionStorage.getItem("token") ?? localStorage.getItem("token"));

    return <ModernApp getAllowContours={allowContourHandle} homePage afterLogout={()=>{history.go(0)}}>
        <h1 align='center' className={classes.header}><img src={"/"+currentIcon.src} className={classes.logo} alt={"Логотип"}></img> {manifest?manifest.name:""}</h1>        
        {
            !(requestToAPI.token || savedToken)?
                <div className={classes.form_login}>
                    <SignupContent cb={()=>{history.go(0)}} />
                </div>
            :<Row className={classes.row} gutter={[16,16]}>
                {
                    allowContours.map((c) => buildCard(c))
                }
            </Row>
        }
    </ModernApp>
}

export const Home = withStyles(styles)(HomeImpl)

