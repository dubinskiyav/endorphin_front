import React, {FC, ReactNode} from 'react';
import {Modal, notification, Button, FormInstance} from 'antd';
import { CloseOutlined } from '@ant-design/icons'
import { MSG_NO_RECORD_FORGETONE, MSG_SAVE_ERROR, MSG_CONFIRM_MODIFY } from './Const';
import requestToAPI from "./Request";
import { getLoginButton } from "./LoginForm";
import { confirm } from "./Dialogs";
import { resq$ } from 'resq'
import { useHistory } from "react-router-dom";
import moment from 'moment';
import {deepClone} from './Utils'
import {objectWithAnyFields} from "./types";

export const FORM_MAX_WIDTH = 30000;

interface CommandButtonProps {
    children: ReactNode
    [x:string|number]: any
}

const CommandButton:FC<CommandButtonProps> = (props) => {
    return <Button {...props}>{props.children}</Button>
}


interface EditFormProps {
    idName?: string,  // default "id"
    editorContext: objectWithAnyFields // тип-объект с различными полями,
    afterCancel: () => void,
    beforeSave?: (value: any) => void,
    afterSave?: (value: any) => void,
    afterCopy?: (value: any, newdata?:any) => void,
    visible: boolean,
    id: string,
    form: FormInstance,
    width?: number | string,
    height?: number | string,
    copyButtonFlag?: boolean,
    convertors?: objectWithAnyFields,
    onAfterLoad?: (value: any) => any,
    transformerData?: (value: any) => void,
    modeCopy?: boolean,
    status?: any,
    children?: any,
    title?: string,
    okBtnCaption?:string
}

const EditForm: FC<EditFormProps> = ({idName= "id", visible = false,
                                         width= -1, ...props}) => {
    const [data, setData] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(false);
    const [internalTrigger] = React.useState<objectWithAnyFields>({});
    const [status] = React.useState<objectWithAnyFields>({});
    const history = useHistory();
    const [contextParams] = React.useState<objectWithAnyFields>({});
    const noSave = !props.editorContext.uriForSave;
    const convertors = props.convertors;
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);

    const closeDialog = React.useCallback(() => {
        props.afterCancel();
        // если компонент размонтирован не надо устанавливать данные
        if (!contextParams.mountFlag) return;
        setData(null);
    }, [props, contextParams.mountFlag])

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
        status.modeCopy = noSave; // если нет uri для сохранения переходим в режим копировать
        setLoading(true);
        if (props.editorContext.uriForGetOne) {
            console.log(props.editorContext.id ? "Load for id = " + props.editorContext.id : "Load for add");
            //props.editorContext.uriForGetOne может быть функцией
            let promise;
            if(typeof props.editorContext.uriForGetOne == 'function') {
                promise = props.editorContext.uriForGetOne(props.editorContext.id)
            } else {
                promise = requestToAPI.post(props.editorContext.uriForGetOne, props.editorContext.id ?? "");
            }
            promise
                .then((response: any) => {
                    // если компонент размонтирован не надо устанавливать данные
                    if (!contextParams.mountFlag) return;
                    if (props.onAfterLoad) {
                        response = props.onAfterLoad(response) ?? response;
                    }
                    // преобразование в плоскую структуру
                    if(props.transformerData) {
                        props.transformerData(response);
                    }
                    // Выполним конвертирование полученного ответа в соответствии с пропсом convertors
                    setData(convertLoad(response));
                    // если есть внутренее событие
                    if(internalTrigger.onAfterLoad) {
                        internalTrigger.onAfterLoad(response);
                    }
                })
                .catch((error: any) => {
                    // если компонент размонтирован не надо устанавливать данные
                    if (!contextParams.mountFlag) return;
                    notification.error({
                        message: MSG_NO_RECORD_FORGETONE,
                        description: error.message,
                        btn: getLoginButton(error.status, history)
                    })
                    closeDialog();
                })
                .finally(()=>{
                    setLoading(false);
                })
        } else if (props.editorContext.record) {
            status.modeCopy = props.modeCopy ?? false;
            setLoading(false);
            // преобразование в плоскую структуру
            if(props.transformerData) {
                props.transformerData(props.editorContext.record);
            }
            setData(convertLoad(props.editorContext.record));
        } else {
            setLoading(false);
            setData({});
        }
    }, [props, status, history, contextParams.mountFlag, closeDialog, noSave, convertors,internalTrigger])

    React.useEffect(() => {
        if (data != null && Object.keys(data).length != 0) {
            props.form.resetFields();
        }
    }, [data, props.form]);

    React.useEffect(() => {
        contextParams.mountFlag = true;

        if (!data && visible) {
            setData({});
            load();
        }
        // размонтирования компонента сбросит флаг
        return (): any => contextParams.mountFlag = false;
    }, [data, contextParams, load, visible]);

    //Сохранение
    const save = React.useCallback((svalues: any, after: (value: any) => void) => {
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
        //делаем глубокую копию! так как setLoading вызывает скрытое обновление
        // состояние и содержимое values может изменится
        const values = deepClone(svalues);

        // Выполним конвертирование сохраняемых данных в соответствии с пропсом convertors
        const valuesForSend = convertSave(values);
        console.log("Save values", valuesForSend);
        if (props.editorContext.uriForSave) {
            //props.editorContext.uriForSave может быть функцией
            let promise;
            if(typeof props.editorContext.uriForSave == 'function') {
                promise = props.editorContext.uriForSave(valuesForSend)
            } else {
                promise = requestToAPI.post(props.editorContext.uriForSave, valuesForSend);
            }
            setLoading(true);
            promise
                .then((response: any) => {
                    after(response);
                })
                .catch((error: any) => {
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
                .finally(()=>{
                    if(contextParams.mountFlag) setLoading(false);
                })
        } else {
            after(valuesForSend);
        }
    }, [props, data, history, convertors,contextParams.mountFlag]);

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

    const afterCopy = React.useCallback((response: any, newData:any) => {
        if (props.afterCopy) {
            props.afterCopy(response,newData);
        }
    }, [props])

    const handleKeyDown = (ev: any) => {
        switch (ev.which) {
            case 13: {
                // только если не в режиме добавления
                if (!status.modeCopy) {
                    let root = document.getElementsByClassName("__dialog__" + props.id);
                    const btn = (resq$('button', root[0] as any) as any).byProps({ id: "ok-btn" });
                    btn.props.onClick(btn);
                }
                ev.stopPropagation();
                break;
            }
            case 27: {
                let root = document.getElementsByClassName("__dialog__" + props.id);
                let btn;
                if (!status.modeCopy) {
                    btn = (resq$('button', root[0] as HTMLElement) as any).byProps({ id: "cancel-btn" });
                } else {
                    // Это кнопка Закрыть
                    btn = (resq$('button', root[0] as HTMLElement) as any).byProps({ id: "ok-btn" });
                }
                if (btn) {
                    btn.props.onClick(btn);
                }
                ev.stopPropagation();
                break;
            }
            default:
        }
    }

    const handleFieldsChange = (flds: any) => {
        status.modified = true;
    }

    const handleCancel = () => {
        if (status.modified) {
            confirm(MSG_CONFIRM_MODIFY, () => {
                closeDialog();
            })
        } else {
            closeDialog();
        }
    };

    const handleOk = (ev: any, copyClickFlag: boolean) => {
        // если кнопка Ok, но в режиме копирования, то просто закрываем
        if (!copyClickFlag && status.modeCopy) {
            afterSave(null);
            if(contextParams.mountFlag) setData(null);
            return;
        }
        if (props.status) {
            props.status.isModeAdd = !props.editorContext.id || copyClickFlag;
        }
        props.form.validateFields()
            .then((values) => {
                // при редактировании добавим Id в данные
                if (props.editorContext.id && !copyClickFlag) {
                    values[idName] = props.editorContext.id;
                }
                // переключаем в режим копирования
                if (copyClickFlag) {
                    status.modeCopy = true;
                }
                beforeSave(values);
                save(values, (response) => {
                    console.log("after save response", response);
                    // если копируем то окно не закрываем, данные не сбрасываем
                    if (!copyClickFlag) {
                        afterSave(response);
                        if(contextParams.mountFlag) setData(null);
                    } else {
                        status.modified = false;
                        // при копировании нужно обновить data иначе поля ввода
                        // пересоздадуться с initValues
                        const newdata = { ...data };
                        Object.assign(newdata, response);
                        afterCopy(response,newdata)
                        setData(newdata);
                    }
                })
            })
            .catch((info) => {
                console.log('Validate Failed:', info);
            });
    }

    if (props.children.props.events) {
        props.children.props.events.handleOk = handleOk;
        props.children.props.events.forceUpdate = forceUpdate;
    }

    const handleCopy = (ev: any) => {
        handleOk(ev, true);
    }

    let modalWidth: any = width;
    if (typeof modalWidth == 'number' && modalWidth < 0) {
        modalWidth = undefined;
    }

    let modalHeight = props.height;
    // не модифицируем задание в процентах от размеров окна, например 100vh
    if(!(typeof modalHeight == 'string' && (modalHeight.endsWith('vh') || modalHeight.startsWith('calc')))) {
        if (typeof modalHeight !== 'number' || modalHeight < 0) {
            modalHeight = "auto";
        }
    }

    const mergeInitialValues = (data: any, initialValues: any) => {
        for (var i in initialValues) {
            data[i] = initialValues[i];
        }
        return data;
    }

    const additionalButtons = props.children.props.additionalButtons ?? [];


    return <Modal
        centered={true}
        destroyOnClose
        // атрибут preserve относится к форме - <Form preserve={false} />
        // preserve={false}
        wrapClassName={"__dialog__" + props.id}
        visible={visible}
        title={props.title || ((props.editorContext.id && !status.modeCopy) ? "Изменение записи" : "Новая запись")}
        width={modalWidth}
        bodyStyle={{ "height": modalHeight,"overflow":"auto"}}
        closeIcon={<CloseOutlined/>}
        onCancel={handleCancel}
        footer={[
            props.copyButtonFlag ? <CommandButton id="copy-btn" key="1" loading={loading} onClick={handleCopy}>Добавить</CommandButton> : null,
            !status.modeCopy ? <CommandButton id="cancel-btn" key="2" onClick={handleCancel}>Отмена</CommandButton> : null,
            <CommandButton id="ok-btn" type={status.modeCopy ? null : "primary"} key="3" loading={loading} onClick={handleOk}>{status.modeCopy ? 'Закрыть' : props.okBtnCaption??'Сохранить'}</CommandButton>,
            ...additionalButtons
        ]}
    >
        <div onKeyDown={handleKeyDown}>
            {props.children ? React.cloneElement(props.children, {
                initialValues: mergeInitialValues(data || {}, props.children.props.initialValues),
                internalTrigger: internalTrigger,
                onFieldsChange: handleFieldsChange,
                mode: props.editorContext.id ? 1 : 0
            }) : null}
        </div>
    </Modal>
}


interface ShowModalProps {
    dialogId?: string,
    setTopLayer?: ((value: any) => void) | undefined,
    topLayer?: any,
    form: FormInstance,
    destroyDialog: (value: number | string) => void,
    title?: string,
    width?: number | string,
    afterSave?: (value: any) => void,
    editorContext: objectWithAnyFields,
    content: JSX.Element,
    convertors?: objectWithAnyFields,
    idName?: any,
    modeCopy?: any,
    initialValues?: any,
    okBtnCaption?:string,
    beforeSave?:(values:any)=>boolean
}

export const ShowModal: FC<ShowModalProps> = (props) => {
    //props.form.resetFields();
    const dialogId = props.dialogId || "Dialog-" + Math.floor(Math.random() * 10000);
    return <EditForm
        key={dialogId}
        id={dialogId}
        visible={true}
        form={props.form}
        title={props.title}
        width={props.width ?? FORM_MAX_WIDTH}
        editorContext={props.editorContext}
        afterSave={(response) => {
            props.destroyDialog(dialogId)
            if (props.afterSave) props.afterSave(response);
        }}
        afterCancel={() => {
            props.destroyDialog(dialogId)
        }}
        idName={props.idName ?? "id"}
        okBtnCaption={props.okBtnCaption}
        convertors={props.convertors}
        modeCopy={props.modeCopy}
        beforeSave={props.beforeSave}>
        {React.cloneElement(props.content, {
            form: props.form,
            initialValues: props.initialValues || {}
        })}
    </EditForm>
}

export default EditForm;
