import * as React from 'react'
import withStyles,{WithStylesProps} from 'react-jss'
import { useHistory } from "react-router-dom";

import { Button, Form, Input } from 'antd';
import { resq$ } from 'resq'
import requestToAPI from "./Request";

const URI_FOR_REQUEST = "/security/recovery/request";

// JSS. Стили компонента
const styles = {
    success: {
        textAlign: 'center',
        color: "green"
    },
    error_message: {
        width:340,
        wordBreak: 'break-all'
    }
}    

// спецификация пропсов
interface ComponentProps extends WithStylesProps<typeof styles> {
    cb?:()=>void,
    setControlCase?:any
}    

const ForgetPasswordImpl:React.FC<ComponentProps> = ({cb,classes,setControlCase}) => {
    const [form] = Form.useForm();
    const firstInputRef = React.useRef<any>(null);
    const [loading, setLoading] = React.useState(false);
    const [resultMode, setResultMode] = React.useState(false);
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

    const handleKeyDown = (ev:any) => {
        if (ev.which == 13) {
            let root = document.getElementById("root") ?? undefined;
            const okBtn = (resq$('Button', root) as any).byProps({ type: "primary" });
            okBtn.props.onClick(okBtn);
        }
    }

    const backHandle = ()=>{
        if(setControlCase) {
            setControlCase("");
        } else {
            history.go(0);
        }
    };

    const recovery = () => {
        form.setFieldsValue({ error: undefined });
        return form.validateFields()
            .then((values) => {
                setLoading(true);
                return requestToAPI.post(URI_FOR_REQUEST, values);
            })
            .then(response => {
                if(cb) {
                    cb();
                }
                setResultMode(true);
            })
            .catch((error) => {
                if (error.message) {
                    form.setFieldsValue({ error: error.message });
                }
            })
            .finally(()=>{
                setLoading(false);
            });
    }

    switch (resultMode) {
        case true:
            return <div className={classes.success}>
                    <div>Письмо для восстановления пароля успешно отправлено на ваш адрес.</div>
                    <div>Ожидайте письма в вашей почтовой программе.</div>
                </div>;
        default:
            return <div onKeyDown={handleKeyDown}>
                <Form
                    layout={"vertical"}
                    form={form}
                    name="formForgetPassword"
                    style={{ padding: 20 }}
                    initialValues={{}}>

                    <Form.Item
                        name="emailOrLogin"
                        label="E-mail или имя пользователя"
                        rules={[
                            {
                                required: true,
                                message: "E-mail или имя пользователя не может быть пустым",
                            }
                        ]}>
                        <Input ref={firstInputRef} style={{width:340}}/>
                    </Form.Item>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.error !== currentValues.error}>
                        {
                            ({ getFieldValue }) =>
                                getFieldValue('error') ? (
                                    <div className={"ant-form-item ant-form-item-explain ant-form-item-explain-error "+classes.error_message}>{getFieldValue('error')}</div>
                                ) : null
                        }
                    </Form.Item>
                    <Form.Item
                        style={{textAlign: 'center'}}
                    >
                        <Button type="primary" onClick={recovery} loading={loading}>Восстановить пароль</Button>
                    </Form.Item>
                    <Form.Item
                        style={{textAlign: 'center'}}
                    >
                        {
                          // eslint-disable-next-line
                        }<a onClick={backHandle}>Вернуться</a> 
                    </Form.Item>

                </Form>
            </div>;
    }
}

export const ForgetPassword = withStyles(styles)(ForgetPasswordImpl)
