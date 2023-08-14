import React, {FC} from 'react';

import { notification, Button } from 'antd';
import { MSG_NO_RECORD_FORGETONE, MSG_SAVE_ERROR} from './Const';
import requestToAPI from "./Request";
import { getLoginButton } from "./LoginForm";
import { useHistory } from "react-router-dom";
import moment from 'moment';

import ModuleHeader from "./ModuleHeader";


interface ConvertorsType {
    [key: string]: any
}


interface EditPageProps {
    idName: string,
    editorContext: any,
    form: any,
    beforeSave?: (value: any) => void,
    afterSave?: (value: any) => void,
    convertors?: ConvertorsType,
    buttons?: any[],
    onSearch?: () => void,
    onAfterLoad?: (value: any) => any,
    title?: string,
    children?: any
}

const EditPage: FC<EditPageProps> = ({idName = "id", ...props}) => {
    const [data, setData] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(false);
    const [internalTrigger] = React.useState<any>({});
    const [status] = React.useState<any>({});
    const [contextParams] = React.useState<any>({});
    const history = useHistory();

    const convertors = props.convertors;
    const readonly = !props.editorContext.uriForSave;

    //Загрузка
    const load = React.useCallback(() => {
        const convertLoad = (response: any) => {
            let convertedResponse = { ...response };
            if (convertors && convertors.date) {
                convertors.date.forEach((element: any) => {
                    if (convertedResponse[element]) {
                        convertedResponse[element] = moment(convertedResponse[element]);
                    }
                });
            }
            return convertedResponse;
        };

        status.modified = false;
        setLoading(true);
        if (props.editorContext.uriForGetOne) {
            console.log(props.editorContext.id>0 ? "Load for id = " + props.editorContext.id : "Load for add");
            requestToAPI.post(props.editorContext.uriForGetOne, props.editorContext.id>0?props.editorContext.id:"")
                .then(response => {
                    // если компонент размонтирован не надо устанавливать данные
                    if (!contextParams.mountFlag) return;
                    if (props.onAfterLoad) {
                        response = props.onAfterLoad(response) ?? response;
                    }
                    setLoading(false);
                    // Выполним конвертирование полученного ответа в соответствии с пропсом convertors
                    setData(convertLoad(response));
                    // если есть внутренее событие
                    if(internalTrigger.onAfterLoad) {
                        internalTrigger.onAfterLoad(response);
                    }
                    props.form.resetFields();
                })
                .catch(error => {
                    // если компонент размонтирован не надо устанавливать данные
                    if (!contextParams.mountFlag) return;
                    setLoading(false);
                    notification.error({
                        message: MSG_NO_RECORD_FORGETONE,
                        description: error.message,
                        btn: getLoginButton(error.status, history)
                    })
                })
        } else if (props.editorContext.record) {
            setLoading(false);
            setData(convertLoad(props.editorContext.record));
        } else {
            setLoading(false);
            setData({});
        }
    }, [props, status, history, contextParams.mountFlag, convertors,internalTrigger])


    const save = React.useCallback((values: any, after: any) => {
        const convertSave = (values: any) => {
            let convertedValues = { ...values };
            if (convertors && convertors.date) {
                convertors.date.forEach((element: any) => {
                    if (convertedValues[element]) {
                        convertedValues[element] = convertedValues[element].valueOf();
                    }
                });
            }
            return convertedValues;
        };

        // Выполним конвертирование сохраняемых данных в соответствии с пропсом convertors
        const valuesForSend = convertSave(values);
        console.log("Save values", valuesForSend);
        if (props.editorContext.uriForSave) {
            setLoading(true);
            requestToAPI.post(props.editorContext.uriForSave, valuesForSend)
                .then(response => {
                    setLoading(false);
                    after(response);
                    history.goBack();
                })
                .catch(error => {
                    setLoading(false);
                    notification.error({
                        message: MSG_SAVE_ERROR,
                        description: error.message,
                        btn: getLoginButton(error.status, history)
                    })

                    // Нужно обновить data иначе поля ввода пересоздадуться с initValues
                    const newdata = { ...data };
                    Object.assign(newdata, values);
                    setData(newdata);
                })
        } else {
            after(values);
        }
    }, [props, data, history, convertors]);

    React.useEffect(() => {
        contextParams.mountFlag = true;

        if (!data) {
            setData({});
            load();
        }
        // размонтирования компонента сбросит флаг
        return (): any => contextParams.mountFlag = false;
    }, [data, contextParams, load]);

    const mergeInitialValues = (data: any, initialValues: any) => {
        for (var i in initialValues) {
            data[i] = initialValues[i];
        }
        return data;
    }

    const beforeSave = React.useCallback((values: any) => {
        if (internalTrigger.onBeforeSave) {
            internalTrigger.onBeforeSave(values);
        }
        if (props.beforeSave) {
            props.beforeSave(values);
        }
    }, [props, internalTrigger])

    const afterSave = React.useCallback((response: any) => {
        status.modified = false;
        if (props.afterSave) {
            props.afterSave(response);
        }
    }, [props, status])

    const handleFieldsChange = (flds: any) => {
        status.modified = true;
    }

    const handleOk = (ev: any) => {
        props.form.validateFields()
            .then((values: any) => {
                // при редактировании добавим Id в данные
                if (props.editorContext.id>0) {
                    values[idName] = props.editorContext.id;
                }
                beforeSave(values);
                save(values, (response: any) => {
                    console.log("after save response", response);
                    afterSave(response);
                    setData(null);
                })
            })
            .catch((info: any) => {
                console.log('Validate Failed:', info);
            });
    }

    const handleKeyDown = (ev: any) => {
        switch (ev.which) {
            case 13: {
                const okBtn = document.getElementById("ok-btn");
                if(okBtn) {
                    okBtn.click();
                    ev.stopPropagation();
                }
                break;
            }
            default:
        }
    }
    const buttons = [
        !readonly?<Button id="ok-btn" type={"primary"} key="3" loading={loading} onClick={handleOk}>Сохранить</Button>:undefined,
        ...(props.buttons??[])
    ];
    if(!buttons[0]) {
        buttons.splice(0,1);
    }

    const values = mergeInitialValues(data || {}, props.children? props.children.props.initialValues:{});

    return <React.Fragment>
            <ModuleHeader
                search={!!props.onSearch}
                title={props.title || (props.editorContext.id>0 ? "Изменение записи" : "Новая запись")}
                buttons={buttons}
                showButtonsInMobile={true}
                onSearch={props.onSearch}
            />
            <hr/>
            <div onKeyDown={handleKeyDown}>
                {props.children ? React.cloneElement(props.children, {
                    initialValues: values,
                    internalTrigger: internalTrigger,
                    onFieldsChange: handleFieldsChange,
                    form:props.form,
                    mode: props.editorContext.id ? 1 : 0
                }) : null}
            </div>

    </React.Fragment>;
}

export default EditPage;
