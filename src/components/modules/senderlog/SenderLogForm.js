import React from 'react';
import { Form, Input } from 'antd';
import { FORM_ITEMS_LAYOUT} from "../../lib/Const";
import moment from 'moment';
import {DEFAULT_DATETIME_FORMAT } from "../../lib/Const"
import {STATUS_ICON,STATUS_LABEL} from './SenderLog';

const { TextArea } = Input;


const SenderLogForm = (props) => {
    let values = {...props.initialValues};

    if(Object.keys(values).length>0) {
        values.senderLogDateTime=moment(values.senderLogDateTime).format(DEFAULT_DATETIME_FORMAT);
        values.senderLogTypeName = values.senderLogTypeName?values.senderLogTypeName:'-';
        values.senderLogStatusTxt = values.senderLogStatus !== undefined?STATUS_LABEL[values.senderLogStatus]:"Отправка ожидается";
        values.senderLogErrorMessage = values.senderLogErrorMessage?values.senderLogErrorMessage:'';
    }

    return <Form
        {...FORM_ITEMS_LAYOUT}
        form={props.form}
        layout="horizontal"
        name="formEdizm"
        onFieldsChange={props.onFieldsChange}
        initialValues={values}
    >
        <Form.Item
            name="senderLogDateTime"
            label="Дата/время включения в очередь отправки"
        >
            <Input readOnly style={{ width: 200 }} />
        </Form.Item>
        <Form.Item
            name="senderLogTypeName"
            label="Тип сообщения"
            >
            <Input readOnly style={{ width: "90%" }} />
        </Form.Item>
        <Form.Item
            name="entityId"
            label="Идентификатор в таблице-источнике"
            >
            <Input readOnly style={{ width: 80 }} />
        </Form.Item>
        <Form.Item
            name="senderLogMessageId"
            label="Идентификатор отправленного сообщения"
            >
            <Input readOnly style={{ width: "90%" }} />
        </Form.Item>
        <Form.Item
            name="senderLogStatusTxt"
            label="Статус"
        >
            <Input readOnly style={{ width: "90%" }} addonBefore={STATUS_ICON[values.senderLogStatus]}/>
        </Form.Item>
        <Form.Item
            name="senderLogErrorMessage"
            label="Сообщение об ошибке"
        >
            <TextArea readOnly style={{ width: "90%" }} rows={5} />
        </Form.Item>

    </Form>


}    

export default SenderLogForm;