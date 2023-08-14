import React from 'react';
import { Input, Button, Menu, Dropdown, notification } from 'antd';
import { FieldNumberOutlined, EllipsisOutlined } from '@ant-design/icons';
import requestToAPI from "./Request";
import { NONE } from "./ModuleConst";
import { buildURL, getItemFromLocalStorage, setItemInLocalStorage } from "./Utils";
import { MSG_ERROR_NUMBERING_GET, MSG_ERROR_NUMBERING_RUN } from "./Const";
import { RESOURCE_NUMBERING } from "./CapResourceType";
import withStyles, {WithStylesProps} from "react-jss";

const numberingCache: any = {};

// JSS. Стили компонента
const styles = {
    numbering: {
        '& .ant-input-group-addon': {
            padding: 0
        },
        '& button': {
            height: '30px',
            '&:first-child': {
                border: 'none'
            },
            '&:not(:first-child)': {
                borderTop: 'none',
                borderBottom: 'none',
                borderRight: 'none'
            }
        }
    }
}



interface NumberingProps extends WithStylesProps<typeof styles> {
    docEntityName: string,
    interface?: any,
    afterLoad?: () => void,
    params?: object | ((value: any) => void),
    disabled?: boolean,
    onChange?: (value: any) => void,
    [key: string]: any
}


const Numbering = React.forwardRef<any, NumberingProps>((props, ref) => {
    const { docEntityName, params, disabled, afterLoad, classes, ...otherProps} = props;
    const [artifactCode, setArtifactCode] = React.useState();
    let artifacts = React.useRef<any>([]);
    const [value, setValue] = React.useState();
    const [contextParams] = React.useState<any>({});

    const handleMenuClick = React.useCallback((e: any) => {
        if (e.key) {
            setArtifactCode(e.key);
            setItemInLocalStorage("numbering_" + docEntityName + "_defaultValue", e.key);

            let subMenu: any[] = [];
            artifacts.current.forEach((value: any) => {
                subMenu.push(<Menu.Item key={value.code}>{value.name}</Menu.Item>);
            })
            setMenu(
                <Menu onClick={handleMenuClick} selectedKeys={[e.key]}>
                    {subMenu}
                </Menu>
            )
        }
    }, [setArtifactCode, docEntityName])

    let [menu, setMenu] = React.useState(
        <Menu onClick={handleMenuClick}>
            <Menu.Item>Загрузка...</Menu.Item>
        </Menu>
    );

    const internalAfterLoad = React.useCallback((data: any) => {
        // если компонент размонтирован не надо устанавливать данные
        if (!contextParams.mountFlag) return;
        artifacts.current = data;
        let defaultValue: any = getItemFromLocalStorage("numbering_" + docEntityName + "_defaultValue");
        // Установим первый элемент полученного массива в качестве нумератора по умолчанию
        if (artifacts.current.length > 0) {
            let flagFound = false;
            for (let i = 0; i < artifacts.current.length; i++) {
                if (artifacts.current[i].code === defaultValue) {
                    setArtifactCode(artifacts.current[i].code);
                    flagFound = true;
                    break;
                }
            }
            if (!flagFound) {
                defaultValue = artifacts.current[0].code;
                setArtifactCode(artifacts.current[0].code);
            }
        }
        let subMenu: any[] = [];
        artifacts.current.forEach((value: any) => {
            subMenu.push(<Menu.Item key={value.code}>{value.name}</Menu.Item>);
        })
        setMenu(
            <Menu onClick={handleMenuClick} selectedKeys={[defaultValue]}>
                {subMenu}
            </Menu>
        )
    }, [setMenu, handleMenuClick, docEntityName, contextParams])

    const doAfterLoad = React.useCallback(() => {
        if(afterLoad) {
            // чтобы произошло асинхронное обновления state после load
            setTimeout(() => afterLoad(), 0);
        }
    },[]);    // eslint-disable-line

    const load = React.useCallback(() => {
        // если компонент размонтирован не надо устанавливать данные
        if (!contextParams.mountFlag) return;

        if (!numberingCache[docEntityName + "_" + requestToAPI?.user?.login]) {
            requestToAPI.post(buildURL(NONE, NONE, "Artifacts") + "/list-of-call", {
                pagination: {
                    current: 1,
                    pageSize: 10
                },
                filters: {
                    entity: docEntityName,
                    kind: RESOURCE_NUMBERING,
                },
            })
                .then((response: any) => {
                    if (requestToAPI.user) {
                        numberingCache[docEntityName + "_" + requestToAPI.user.login] = response.result;
                        internalAfterLoad(numberingCache[docEntityName + "_" + requestToAPI.user.login]);
                    }
                    doAfterLoad();
                })
                .catch(error => {
                    // если компонент размонтирован не надо устанавливать данные
                    if (!contextParams.mountFlag) return;
                    notification.error({
                        message: MSG_ERROR_NUMBERING_GET,
                        description: error.message,
                    })
                });
        } else {
            if (requestToAPI.user) {
                internalAfterLoad(numberingCache[docEntityName + "_" + requestToAPI.user.login]);
            }
            doAfterLoad();
        }
    }, [docEntityName, contextParams, internalAfterLoad,doAfterLoad])

    React.useEffect(() => {
        contextParams.mountFlag = true;
        setTimeout(() => load(), 200);
        // размонтирования компонента сбросит флаг
        return (): any => contextParams.mountFlag = false;
    }, [load, contextParams]);

    const getArtifactByCode = (artifactCode: any) => {
        let found;
        artifacts.current.forEach((value: any) => {
            if (value.code === artifactCode) {
                found = value;
            }
        })
        return found;
    }

    const generateNumber = () => {
        console.log("generate number for " + artifactCode);
        const artifact: any = getArtifactByCode(artifactCode);
        requestToAPI.post(buildURL(NONE, NONE, "Artifacts") + "/run", {
            code: artifact.code,
            name: artifact.name,
            kind: RESOURCE_NUMBERING,
            params: (params instanceof Function)?params(artifact):params,
        })
            .then((response: any) => {
                setValue(response.value);
                if (props.onChange) {
                    props.onChange(response.value);
                }
            })
            .catch(error => {
                notification.error({
                    message: MSG_ERROR_NUMBERING_RUN,
                    description: error.message,
                })
            });
    }

    // interface содержит методы, которые можно применять к функциональному компоненту
    // в стиле компонента, построенного на классах
    if (props.interface) {
        props.interface.generateNumber = generateNumber;
    }

    return (
        <Input
            className={classes.numbering}
            style={{ width: 200 }}
            addonAfter={
                <>
                    <Button onClick={generateNumber} icon={<FieldNumberOutlined />} disabled={disabled || artifactCode === undefined} />
                    <Dropdown overlay={menu} disabled={disabled}>
                        <Button icon={<EllipsisOutlined />} />
                    </Dropdown>
                </>
            }
            value={value}
            disabled={disabled}
            ref={ref}
            {...otherProps}
        />
    )
})


export default withStyles(styles)(Numbering)
