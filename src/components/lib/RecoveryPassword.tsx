import React, {FC} from 'react';
import {Button, Form, FormInstance, Input} from 'antd';
import { resq$ } from 'resq'
import requestToAPI from "./Request";
import { withRouter } from "react-router";
import { useHistory } from "react-router-dom";
import withStyles, {WithStylesProps} from "react-jss";

const URI_FOR_SAVE = "/security/recovery/save";
const URI_FOR_LOGIN = "gettoken";

let _activeValidator: FormInstance



// JSS. Стили компонента
const styles = {
    center: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        "& .ant-form-item-control-input-content": {
            display: 'flex',
            justifyContent: 'center'
        },
        "& form": {
            width: '232px'
        }
    }
}

interface RecoveryPasswordProps extends WithStylesProps<typeof styles> {
    match: any
}

export const RecoveryPassword: FC<RecoveryPasswordProps> = (props) => {
    const [form] = Form.useForm();
    const firstInputRef = React.useRef<any>(null);
    const [loading, setLoading] = React.useState(false);
    const history = useHistory();

    React.useEffect(() => {
        const timerId = setTimeout(() => {
            if (firstInputRef.current)
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

    _activeValidator = form;

    const login = () => {
        let valuesLogin: any;
        _activeValidator.setFieldsValue({ error: undefined });
        return _activeValidator.validateFields()
            .then((values) => {
                if (values.newPassword !== values.confirmNewPassword) {
                    let errorMessage = "Подтверждение пароля не совпадает с новым паролем"
                    _activeValidator.setFieldsValue({ error: errorMessage });
                    throw errorMessage;
                }
                setLoading(true);
                values = {...values, key: props.match.params.key};
                valuesLogin = {password: values.newPassword};
                return requestToAPI.post(URI_FOR_SAVE, values);
            })
            .then((response: any) => {
                valuesLogin = {...valuesLogin, userName: response.login};
                return requestToAPI.post(URI_FOR_LOGIN, valuesLogin)
                    .then((response: any) => {
                        requestToAPI.token = response.token;
                        requestToAPI.user = {
                            login: response.user.login,
                            name: response.user.name,
                        };
                        history.push("/");
                    })
                    .catch((error) => {
                        setLoading(false);
                        if (error.message) {
                            _activeValidator.setFieldsValue({ error: error.message });
                        }
                        throw error;
                    });
            })
            .catch((error) => {
                setLoading(false);
                if (error.message) {
                    _activeValidator.setFieldsValue({ error: error.message });
                }
                throw error;
            });
    }

    return <div className={props.classes.center}>
        <div onKeyDown={handleKeyDown}>
            <Form
                layout={"vertical"}
                form={form}
                name="formRecoveryPassword"
                style={{ padding: 20 }}
                initialValues={{}}>

                <Form.Item
                    name="newPassword"
                    label="Новый пароль"
                    rules={[
                        {
                            required: true,
                            message: "Новый пароль не может быть пустым",
                        }
                    ]}>
                    <Input.Password ref={firstInputRef} />
                </Form.Item>

                <Form.Item
                    name="confirmNewPassword"
                    label="Подтверждение пароля"
                    rules={[
                        {
                            required: true,
                            message: "Подтверждение пароля не может быть пустым"
                        }
                    ]}
                >
                    <Input.Password />
                </Form.Item>

                <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) => prevValues.error !== currentValues.error}>
                    {
                        ({ getFieldValue }) =>
                            getFieldValue('error') ? (
                                <div className="ant-form-item ant-form-item-explain ant-form-item-explain-error">{getFieldValue('error')}</div>
                            ) : null
                    }
                </Form.Item>
                <Form.Item>
                    <Button type="primary" onClick={login} loading={loading}>Установить пароль</Button>
                </Form.Item>
            </Form>
        </div>
    </div>
}

// @ts-ignore
export default withRouter(withStyles(styles)(RecoveryPassword));



