import React, {FC} from 'react';
import {Form, FormInstance, Input} from 'antd';
import {FORM_ITEMS_LAYOUT} from "./Const";

let _activeValidator: FormInstance

interface ComponentProps {
    form: FormInstance
}


export const ChangePasswordForm: FC<ComponentProps> = ({form}) => {
    const firstInputRef = React.useRef<any>(null);
    _activeValidator = form;

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

    const change = () => {
        _activeValidator.setFieldsValue({ error: undefined });
        return _activeValidator.validateFields()
            .then((values) => {
                if (values.newPassword !== values.confirmNewPassword) {
                    let errorMessage = "Подтверждение пароля не совпадает с новым паролем"
                    _activeValidator.setFieldsValue({ error: errorMessage });
                    throw errorMessage;
                }
            })
            .catch((error) => {
                if (error.message) {
                    _activeValidator.setFieldsValue({ error: error.message });
                }
                throw error;
            });
    }


    return <Form
            {...FORM_ITEMS_LAYOUT}
            layout={"horizontal"}
            form={form}
            name="formChangePassword"
            onFinish={change}
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
                        message: "Новый пароль не может быть пустым"
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
                        message: "Подтверждение пароля не может быть пустым",
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
           </Form>

}
