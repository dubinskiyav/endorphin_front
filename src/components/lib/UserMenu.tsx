import * as React from 'react'
import { Menu } from 'antd'
import withStyles, { WithStylesProps } from 'react-jss';

import { LogoutOutlined} from '@ant-design/icons';
import requestToAPI from './Request'


// JSS. Стили компонента
const styles = {
    usermenu:{
        borderWidth:"0px"
    },
}    

// спецификация пропсов
interface ComponentProps extends WithStylesProps<typeof styles> {
    changePasswordHandle:()=>void,
    logoutHandle:()=>void
}    

const UserMenuImpl:React.FC<ComponentProps> =({classes,changePasswordHandle,logoutHandle}) => {
    return <Menu selectable={false} className={classes.usermenu}>
        {
            requestToAPI.token ? <>
                <Menu.Item key="changePassword" onClick={changePasswordHandle}>Сменить пароль</Menu.Item>
                <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={logoutHandle}> Выход</Menu.Item>
            </> : undefined
        }
    </Menu>
}

export const UserMenu = withStyles(styles)(UserMenuImpl)