import React, {ReactNode} from 'react';
import {
    Menu, Modal, Form, Checkbox, Input, notification,
    InputNumber, Select
} from 'antd';
import moment from 'moment';

import { PrinterOutlined, RetweetOutlined } from '@ant-design/icons'
import DataTable from "../DataTable";
import { DateInput, DateInputRange } from "../DateInput";
import DataSelect from "../DataSelect";
import { FORM_ITEMS_LAYOUT_FOR_PRINT, MSG_REQUEST_ERROR, MSG_REPORT_RUNNING, CasheTypes } from "../Const";
import requestToAPI from "../Request";
import DataLookup from '../DataLookup';
import { isMobile } from '../Responsive'
import {objectWithAnyFields, paramDescType} from "../types";

import locale from 'antd/es/date-picker/locale/ru_RU'

const { Option } = Select;

let lastPrintForm: objectWithAnyFields = {};
const setLastPrintForm = (pf:any, config: any, record?: any) => {
    if (!record) {
        lastPrintForm.module = pf;
    } else {
        lastPrintForm.entity = pf;
    }
    if (config.forceUpdateModule) {
        config.forceUpdateModule();
    }
}


export const buildPrintMenu = (moduleCode: string, config: any) =>
    <React.Fragment>
        <Menu.Item key="print" icon={<PrinterOutlined />} onClick={(ev) => handlePrintMenu(ev, moduleCode, config)}>Печать...</Menu.Item>
        {lastPrintForm.module ? <Menu.Item key="lastprint" icon={<RetweetOutlined />} onClick={(ev) => {
            process(lastPrintForm.module, config);
            if (ev.domEvent) {
                ev.domEvent.stopPropagation();
            }
        }}>Повторить печать ...</Menu.Item> : ""}
    </React.Fragment>

const handlePrintMenu = (ev: any, moduleCode: string, config: any) => {
    chooseReport({ moduleCode }, (okFlag, selectValueObject) => {
        if (okFlag) {
            process(selectValueObject, config);
        }
    });
}


export const buildEntityPrintMenu = (entityCode: string, record: any, config: any) => {

    return <React.Fragment>
        <Menu.Item key="print"
                   // нет свойства shorthotkey в Menu.Item (альтернативы тоже)
                   // @ts-ignore
                   shorthotkey={{ keyCode: 80, ctrlKey: true }}
                   icon={<PrinterOutlined />}
            onClick={(ev) => handleEntityPrintMenu(ev, entityCode, record, config)}>Печать документа...</Menu.Item>
        {lastPrintForm.entity
            ? <Menu.Item key="lastprint"
                       // @ts-ignore
                       shorthotkey={{ keyCode: 80, ctrlKey: true, shiftKey: true }}
                       icon={<RetweetOutlined />}
                       onClick={(ev) => {process(lastPrintForm.entity, config, record);
                           if (ev.domEvent) {
                            ev.domEvent.stopPropagation();
                        }}}>
                Повторить печать ...
            </Menu.Item>
            : ""
        }
    </React.Fragment>
}


const handleEntityPrintMenu = (ev: any, entityCode: string, record: any, config: any) => {
    if (ev.domEvent) {
        ev.domEvent.stopPropagation(); // чтобы предовратить запуск окна редактирования
    }
    chooseReport({ entityCode, moduleCode:config.moduleCode }, (okFlag, selectValueObject) => {
        if (okFlag) {
            process(selectValueObject, config, record);
        }
    });
}

const tableInterface: objectWithAnyFields = { isLoading: () => false, getSelectedRows: () => [], SetRows: (value: any) => [] };


const chooseReport = (code: any, finalyCB: (fvalue: boolean, svalue?: any) => void) => {

    const checkInput = (closeFunc: () => void) => {
        if (tableInterface.getSelectedRows().length > 0) {
            const rec = tableInterface.getSelectedRecords()[0];
            finalyCB(true, rec);
            closeFunc();
            return;
        }
        notification.error({
            message: "Необходимо выбрать форму"
        })
    }

    Modal.confirm({
        centered: true,
        title: 'Выбор печатной формы',
        width: isMobile() ? undefined : "calc(100vw - 180px)",
        content: (
            <div>
                <DataTable
                    className="mod-main-table"
                    // pagination={{ pageSize: 5 }}
                    selectType="radio"
                    editable={false}
                    uri={{
                        forSelect: "reports/getlist"
                    }}
                    onBeforeRefresh={(params:any) => {
                        params.filters.module = code.moduleCode;
                        params.filters.entity = code.entityCode;
                        return true;
                    }}
                    autoRefresh={true}
                    onAfterRefresh={()  => {
                        if (lastPrintForm.module)
                            tableInterface.SetRows([lastPrintForm.module.code]);
                    }}

                    columns={[
                        {
                            title: 'Наименование',
                            dataIndex: 'name',
                            ellipsis: true,
                            defaultSortOrder: 'ascend',
                        },
                        {
                            title: 'Код',
                            dataIndex: 'code',
                            ellipsis: true,
                            width: "80px"
                        }
                    ]}
                    interface={tableInterface}
                    idName={"code"}
                    defaultSelectRows={true}
                />
            </div>
        ),
        onOk: (closeFunc) => checkInput(closeFunc),
        onCancel: () => finalyCB(false),
        okText: "Выбрать"
    });

}

const process = async (pf: any, config: any, record?: any) => {
    setLastPrintForm(pf, config, record);
    console.log("print form ", pf);
    if (record) {
        console.log("--- for record ", record);
        if (!config.idName)
            throw new Error("Record menu config.idName is undefined");
    }


    const handleOk = (closeFunc: () => void) => {
        config.form.validateFields()
            .then((values: any) => {
                requestToServer(values, closeFunc);
            })
    }

    const requestToServer = (paramValues: any, closeFunc: () => void) => {
        if (record) {
            paramValues[config.idName] = record[config.idName];
        }
        runReport(pf, paramValues);
        closeFunc();
    }

    if (Object.keys(pf.params).length > 0) {
        const initvalues = await genInitValues(pf)

        Modal.confirm({
            centered: true,
            title: 'Выбор значений параметров: ' + pf.name,
            width: isMobile() ? undefined : "calc(100vw - 180px)",
            content: (
                <Form
                    {...FORM_ITEMS_LAYOUT_FOR_PRINT}
                    form={config.form}
                    layout="horizontal"
                    name="formPrintParams"
                    initialValues={initvalues}>
                    {pf.paramsOrder.map((k: any) => genFormItem(pf.params[k]))}
                </Form>
            ),
            onOk: handleOk,
            onCancel: () => { },
            okText: "Выбрать"
        });
        config.form.resetFields();
    } else {
        let paramValues: objectWithAnyFields = {};
        if (record) {
            paramValues[config.idName] = record[config.idName];
        }
        runReport(pf, paramValues);
    }

}

// Режим inline
const openTabForFile = (stream: any, fileName: string) => {
    const url = window.URL.createObjectURL(stream);
    const win = window.open(url, '_blank');
    //встроенный блокировщик всплывающих окон
    if (win === null) {
        notification.warning({
            message: "Включен блокировщик всплывающих окон",
            description: "Чтобы увидеть результат отключите блокировщик всплывающих окон"
        });
    }
}

const downloadFile = (stream:any, fileName:string) => {
    const url = window.URL.createObjectURL(stream);
    let a:any = document.createElement("a");
    a.style = "display: none";
    document.body.appendChild(a);
    a.href = url; 
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
}    

// Режим attachment
const saveAsFile = async (stream:any, fileName:string) => {
    //проверяем наличие функции и выполняет простой download если ее нет
    if(typeof (window as any).showOpenFilePicker !== 'function') {
        downloadFile(stream,fileName);
        return;
    }
    // окно saveAs открывается сразу
    const handle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
        types: [{
            accept:{'text/plain': ['.txt']}
        },{
            accept:{'application/pdf': ['.pdf']}
        },{
            accept:{'application/vnd.ms-excel': ['.xls']}
        },{
            accept:{'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']}
        },{
            accept:{'application/msword': ['.doc']}
        },{
            accept:{'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']}
        }],
    });
    const writableStream = await handle.createWritable();
    await writableStream.write(stream);
    await writableStream.close();        

}    


const runReport = (pf: any, paramValues: any) => {
    console.log("print form", pf);
    console.log("paramValues", paramValues);
    Object.keys(paramValues).forEach(k => {
        const parValue = paramValues[k];
        const paramDesc = pf.params[k];
        if (paramDesc && parValue) {
            switch (paramDesc.type) {
                case "Date":
                    paramValues[k] = parValue.toDate().getTime();
                    break;
                case "DateRange":
                    paramValues[k] = [
                        parValue[0].toDate().getTime(),
                        parValue[1].toDate().getTime()
                    ]
                    break;
                case "Integer":
                    if (typeof parValue == "string") {
                        paramValues[k] = parseInt(parValue);
                    }
                    break;
                case "Boolean":
                    if (typeof parValue == "number") {
                        paramValues[k] = parValue != 0;
                    } else
                        if (typeof parValue == "string") {
                            paramValues[k] = JSON.parse(parValue.toLowerCase());
                        }
                    break;
                case "String":
                    // ничего не делаем
                    break;
                default:
                    throw new Error("Неизвестный тип");
            }

        }
    })
    notification.success({
        message: MSG_REPORT_RUNNING,
        description: "После подготовки формы на сервере она откроется в отдельной вкладке или появится в виде скачанного файла"
    })

    requestToAPI.post("reports/run", { code: pf.code, params: paramValues })
        .then((response: any) => {
            const pfResult = response;
            //console.log("run response = ",pfResult);
            requestToAPI.post(response.url, {}, { extResponse: true })
                .then((response: any) => response.blob())
                .then(blob => {
                    if(pfResult.downloadType=='attachment') {
                        saveAsFile(blob, pfResult.disposition);
                    } else {
                        openTabForFile(blob, pfResult.nameResult);
                    }
                })
                .catch(error => {
                    notification.error({
                        message: MSG_REQUEST_ERROR,
                        description: error.message
                    })
                })
        })
        .catch(error => {
            notification.error({
                message: MSG_REQUEST_ERROR,
                description: error.message
            })
        })
}


const genFormItem = (paramDesc: paramDescType) => {
    return <Form.Item
        key={paramDesc.name}
        name={paramDesc.name}
        label={paramDesc.label}
        valuePropName={paramDesc.type == "Boolean" ? "checked" : undefined}
        rules={[{
            required: paramDesc.options ? !paramDesc.options.nulleable : false,
            message: "Поле обязательно для ввода"
        }
        ]}>
        {genInputComponent(paramDesc)}
    </Form.Item>
}

interface SelectWrapperProps {
    children: ReactNode,
    value?: any,
    [x: string | number]: any
}
const SelectWrapper = React.forwardRef<any, SelectWrapperProps>((props, ref) => {
    const { children, value, ...otherprops } = props;
    return <Select labelInValue
        ref={ref}
        defaultValue={props.value ? '' + props.value : undefined}
        {...otherprops}>{children}</Select>
})

interface CapCodeSelectWrapperProps {
    value?: any,
    [x: string | number]: any
}
const CapCodeSelectWrapper = React.forwardRef<any, CapCodeSelectWrapperProps>((props, ref) => {
    const { value = {}, ...otherprops } = props;


    // @ts-ignore
    return <DataSelect.CapCodeSelect
        ref={ref}
        value={value?.value}
        displayValue={value?.displayText}
        {...otherprops} />;
})

interface DataSelectWrapperProps {
    value?: any,
    displayValueName: string,
    uri: string,
    [x: string | number]: any
}

const DataSelectWrapper = React.forwardRef<any, DataSelectWrapperProps>((props, ref) => {
    const { value = {}, displayValueName, uri, ...otherprops } = props;
    return <DataSelect
        ref={ref}
        value={value.value}
        displayValue={value.displayText}
        displayValueName={displayValueName}
        uri={uri}
        {...otherprops} />;
})

const genInputComponent = (paramDesc: any) => {
    switch (paramDesc.type) {
        case "Integer":
            switch (paramDesc.subType) {
                case "CapCode":
                    return <CapCodeSelectWrapper
                        capCodeType={paramDesc.options.capCodeTypeId}
                        allowClear={paramDesc.options.nulleable}
                        casheType={paramDesc.options.cashable ? CasheTypes.LocalStorage : CasheTypes.None} />;
                case "Select":
                    if (paramDesc.options.uri) {
                        return <DataSelectWrapper
                            uri={paramDesc.options.uri}
                            params={paramDesc.options.dataForPost ? JSON.parse(paramDesc.options.dataForPost) : undefined}
                            valueName={paramDesc.options.valueName}
                            displayValueName={paramDesc.options.displayValueName}
                            allowClear={paramDesc.options.nulleable}
                            casheType={paramDesc.options.cashable ? CasheTypes.LocalStorage : CasheTypes.None} />;
                    } else {
                        // простой select с values
                        const options = paramDesc.options.values.map((v: any) =>
                            <Option key={v.value} value={v.value}>{v.displayText}</Option>);
                        return <SelectWrapper
                            allowClear={paramDesc.options.nulleable}
                        >
                            {options}
                        </SelectWrapper>

                    }
                case "Subject":
                    // @ts-ignore
                    return <DataLookup.Subject />
                //TODO
                case "SGood":
                    //TODO
                    break;
                case "Lookup":
                    //TODO
                    break;
                default:
                    return <InputNumber />;
            };
            return;
        case "Boolean":
            return <Checkbox />;
        case "String":
            return <Input />;
        case "Date":
            // по неведомой причине конфишурирование через ConfigProvider в Modal 
            // диалоге не работает. Приходится явно ставить locale
            return <DateInput locale={locale}/>;
        case "DateRange":
            // по неведомой причине конфишурирование через ConfigProvider в Modal 
            // диалоге не работает. Приходится явно ставить locale
            return <DateInputRange locale={locale}/>;
        default:
            return;
    }
}



const genInitValues = async (pf:any) => {

    const transformParamValue = (par:any, k:string, value:any, values:any)=>{
        switch (par.type) {
            // Date передается в ISO формате
            case "Date":
                values[k] = moment(value)
                break;
            // массив Date  в ISO формате
            case "DateRange":
                values[k] = [moment(value[0]),moment(value[1])]
                break;    
            default:
                values[k] = value
        }    
    }
    
    console.log("print form init patrams", pf.params);
    let values:any = {};
    Object.keys(pf.params)
        .filter(k => pf.params[k].initValue != null)
        .map(k => {
            const par = pf.params[k];
            transformParamValue(par,k,par.initValue.value,values);
        });
    // извлекаем default значения
    return await requestToAPI.post("reports/prepare", {code:pf.code})
        .then(response => {
            const defaultparams:any = (response as any).params;
            Object.keys(defaultparams)
            .map(k => {
                const par = pf.params[k];
                transformParamValue(par,k,defaultparams[k],values);
            });
            console.log("print form default values", values);
            return values;
        })       
}
