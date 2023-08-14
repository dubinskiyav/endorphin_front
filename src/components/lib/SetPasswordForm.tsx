import React, {FC} from 'react';
import { Button, Form, Input } from 'antd';
import { resq$ } from 'resq'
import requestToAPI from "./Request";
import {loginProcess} from "./LoginForm";



const URI_FOR_SAVE = "/security/changepswd";

interface ComponentProps {
    cb?: () => void,
    userName?: string
}

export const SetPasswordContent: FC<ComponentProps> = ({cb, userName}) => {
    const [form] = Form.useForm();
    const firstInputRef = React.useRef<any>(null);
    const [loading, setLoading] = React.useState(false);

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

    const login = () => {
        let valuesLogin: any;
        form.setFieldsValue({ error: undefined });
        return form.validateFields()
            .then((values) => {
                if (values.newPassword !== values.confirmNewPassword) {
                    form.setFields([
                        {
                          name: 'confirmNewPassword',
                          errors: ["Подтверждение пароля не совпадает с новым паролем"]
                        },
                     ]);
                    throw new Error();
                }
                setLoading(true);
                values = {...values, userName: userName};
                valuesLogin = {userName: values.userName, password: values.newPassword};
                return requestToAPI.post(URI_FOR_SAVE, values)
            })
            .then(response => {
                return loginProcess(valuesLogin, {
                    form: form,
                    setLoading:setLoading
                })
                .then(()=>{
                    if (cb) {
                        cb();
                    }
                })
            })
            .catch((error) => {
                // идет сообщение с сервера
                if(error.errorCode) {
                    form.setFields([
                        {
                          name: 'oldPassword',
                          errors: [error.message]
                        },
                     ]);
                }
                setLoading(false);
            })
    }

    return <div onKeyDown={handleKeyDown}>
        <Form
            layout={"vertical"}
            form={form}
            name="formSetPassword"
            style={{ padding: 20 }}
            initialValues={{}}>

            <Form.Item
                name="oldPassword"
                label="Старый пароль"
                rules={[
                    {
                        required: true,
                        message: "Старый пароль не может быть пустым"
                    }
                ]}>
                <Input.Password ref={firstInputRef} />
            </Form.Item>

            <Form.Item
                name="newPassword"
                label="Новый пароль"
                rules={[
                    {
                        required: true,
                        message: "Новый пароль не может быть пустым",
                    }
                ]}
            >
                <Input.Password />
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
                <Button type="primary" onClick={login} loading={loading}>Войти</Button>
            </Form.Item>
        </Form>
    </div>

}
