import React, {FC} from 'react';
import { Button, Form, Input, Checkbox } from 'antd';
import requestToAPI,{ERROR_CODES} from "./Request";
import { HTTP_STATUS_UNAUTHORIZED } from "./Request";
import { MSG_NO_LOGIN_OR_PASSWORD } from "./Const";
import { resq$ } from 'resq';
import { CONTOUR_ADMIN, MODULE_CREDENTIAL } from "./ModuleConst";
import { buildURL, setItemInLocalStorage,getItemFromLocalStorage } from "./Utils";
import { RouteComponentProps } from 'react-router-dom';


const URI_FOR_LOGIN = "gettoken";

export let userProps = getItemFromLocalStorage("userProps")?JSON.parse(getItemFromLocalStorage("userProps")):undefined;

interface LogInOutConfig {
    GlobalAfterLogoutHandle?:()=>void
}    
// Глобальная конфигурация Входа/Выхода
export const LOGINOUT_CONFIG:LogInOutConfig = {
    // глобальный обработчик который выполняется после закрытия соединения
    // Если он undefined то действуйте логика перехода в корень '/'
    // Если обработчиу установлен то не перекрывает его
    GlobalAfterLogoutHandle:undefined
}

export const getLoginButton = (status: number, history: RouteComponentProps["history"] | undefined, cb?: () => void) => {
    if (status != HTTP_STATUS_UNAUTHORIZED) {
        return undefined;
    }
    console.log("getLoginButton")
    return <Button type="primary" 
                onClick={() => logout(LOGINOUT_CONFIG.GlobalAfterLogoutHandle?undefined:history,cb || LOGINOUT_CONFIG.GlobalAfterLogoutHandle)}>Вход в систему</Button>
}

export const restoreToken = () => {
    if (!requestToAPI.token) {
        let saveToken = sessionStorage.getItem("token") ?? localStorage.getItem("token");
        if (saveToken) {
            console.log("Restore token")
            requestToAPI.token = saveToken;
            requestToAPI.user = {
                name: sessionStorage.getItem("user.name") ?? localStorage.getItem("user.name"),
                login: sessionStorage.getItem("user.login") ?? localStorage.getItem("user.login")
            }
        }
    }
}


/**
 * В options передать:
 *  - form - форма ввода
 *  - setControlCase - метод установки флага временного пароля
 *  - setUserName - метод установки имени пользователя (для временного пароля)
 *  - setLoading - метод установки индикатора загрузки
 * @param {*} options
 * @param {*} values - пользователь и пароль
 * @returns обещание
 */

type OptionsType = {
    form: any,
    setLoading: (value: boolean) => void,
    setControlCase?: (value: string) => void,
    setUserName?: (value: string) => void,
}

type User = {
    login: string | null,
    name: string | null
}

 export const loginProcess = (values: object, options: OptionsType)=>{
    options.form.setFieldsValue({error: undefined});
    options.setLoading(true);
    return requestToAPI.post(URI_FOR_LOGIN, values)
        .catch((error) => {
            options.setLoading(false);
            cleanLocalStorage();
            cleanSessionStorage();
            // тут сообщение перекроем, так как UNAUTHORIZED имеет смысл другой
            if (error.status == HTTP_STATUS_UNAUTHORIZED) {
                error.message = MSG_NO_LOGIN_OR_PASSWORD;
            }
            if (error.errorCode == ERROR_CODES.TEMPORARY_ACCESS) {
                if (options.setControlCase) options.setControlCase("tempPass");
                if (options.setUserName) options.setUserName(options.form.getFieldValue("userName"));
            }
            if (error.message) {
                options.form.setFieldsValue({ error: error.message });
            }
            throw error;
        })
        .then((response: any) => {
            requestToAPI.token = response.token;
            requestToAPI.user = {
                login: response.user.login,
                name: response.user.name,
            };

            if (options.form.getFieldValue("saveflag")) {
                console.log('requestToAPI.user', requestToAPI.user)
                setLocalStorage(requestToAPI.token, requestToAPI.user);
            } else {
                setSessionStorage(requestToAPI.token, requestToAPI.user);
            }

            return requestToAPI.post(buildURL(CONTOUR_ADMIN, MODULE_CREDENTIAL, "applicationrole") + "/accesslist", {});
        })
        .then((response: any) => {
            setItemInLocalStorage("modules", JSON.stringify(response.result));
            return requestToAPI.post("system/capclasstype/getlist", {});
        })
        .then((response: any) => {
            setItemInLocalStorage("capClassTypeList", JSON.stringify(response.result));
            return requestToAPI.post("admin/credential/proguser/properties", {})
        })
        .then(response => {
            userProps = response;
            if(userProps) {
                setItemInLocalStorage("userProps", JSON.stringify(userProps));
            }
        })
        .finally(()=>{
            options.setLoading(false);
        })

}

interface ComponentProps {
    cb: () => void,
    setControlCase: (value: string) => void,
    setUserName: (value: string) => void,
}

export const LoginContent:FC<ComponentProps> = ({cb, setControlCase, setUserName}) => {
    const [form] = Form.useForm();
    const firstInputRef = React.useRef<any>(null);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        const timerId = setTimeout(() => {
            firstInputRef.current.focus({
                cursor: 'end',
            })
        }, 100);
        return () => {
            clearTimeout(timerId)
        }
    })

    const handleKeyDown = (ev: any) => {
        if (ev.which == 13) {
            let root = document.getElementById("root") ?? undefined;
            const okBtn = (resq$('Button', root) as any).byProps({ type: "primary" });
            okBtn.props.onClick(okBtn);
        }
    }

    const login = () => {
        return form.validateFields()
            .then((values) => {
                return loginProcess(values, {
                    form: form,
                    setControlCase: setControlCase,
                    setUserName: setUserName,
                    setLoading: setLoading
                })
                .then(()=>{
                    if (cb) {
                        cb();
                    }
                })
            })
    }

    function forgetPass(e: React.MouseEvent<any>) {
        e.preventDefault();
        setControlCase("forgetPass");
    }

    return <div onKeyDown={handleKeyDown}>
        <Form
            layout={"vertical"}
            form={form}
            name="formLogin"
            style={{ padding: 20 }}
            initialValues={{}}>

            <Form.Item
                name="userName"
                label="Имя пользователя"
                rules={[
                    {
                        required: true,
                        message: "Имя пользователя не может быть пустым"
                    }
                ]}>
                <Input ref={firstInputRef} onChange={()=>{
                    form.setFieldsValue({"error":undefined});
                }}/>
            </Form.Item>

            <Form.Item
                name="password"
                label="Пароль"
                rules={[
                    {
                        required: true,
                        message: "Пароль не может быть пустым"
                    }
                ]}
            >
                <Input.Password onChange={()=>{
                    form.setFieldsValue({"error":undefined});
                }}/>
            </Form.Item>
            <Form.Item
                name="saveflag"
                valuePropName="checked"
                getValueFromEvent={(event) => {
                    return event.target.checked ? 1 : 0;
                }}
            >
                <Checkbox>Запомнить меня</Checkbox>
            </Form.Item>
            <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => prevValues.error !== currentValues.error}>
                {
                    ({ getFieldValue }) =>
                        getFieldValue('error') ? (
                            <div className="ant-form-item ant-form-item-explain ant-form-item-explain-error" style={{width:200}}>
                                {getFieldValue('error')}
                            </div>
                        ) : null
                }
            </Form.Item>
            <Form.Item
                style={{textAlign: 'center'}}
            >
                <Button type="primary" onClick={login} loading={loading}>Войти</Button>
            </Form.Item>
            <Form.Item
                style={{textAlign: 'center'}}
            >
                {
                  // eslint-disable-next-line
                }<a onClick={forgetPass}>Забыли пароль?</a>
            </Form.Item>

        </Form>
    </div>

}


export const setSessionStorage = (token: string | undefined, user: User) => {
    if (typeof token === "string") {
        sessionStorage.setItem("token", token);
    }
    if (typeof user.login === "string") {
        sessionStorage.setItem("user.login", user.login);
    }
    if (typeof user.name === "string") {
        sessionStorage.setItem("user.name", user.name);
    }
    cleanLocalStorage();
}

export const cleanSessionStorage = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user.login");
    sessionStorage.removeItem("user.name");
}

export const setLocalStorage = (token: string | undefined, user: User) => {
    if (typeof token === "string") {
        localStorage.setItem("token", token);
    }
    if (typeof user.login === "string") {
        localStorage.setItem("user.login", user.login);
    }

    if (typeof user.name === "string") {
        localStorage.setItem("user.name", user.name);
    }
    cleanSessionStorage();
}

export const cleanLocalStorage = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user.login");
    localStorage.removeItem("user.name");
}

export const logout = (history: RouteComponentProps["history"] | undefined, cb?: () => void) => {
    requestToAPI.token = undefined;
    requestToAPI.user = undefined;
    cleanLocalStorage();
    cleanSessionStorage();
    if(history) history.push("/");
    if (cb) cb();
}
