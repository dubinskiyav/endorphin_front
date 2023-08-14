import React from 'react';
import { Form, Input, Tag } from 'antd';
import { FORM_ITEMS_LAYOUT } from "../../lib/Const";
import DataSelect from "../../lib/DataSelect";
import DataLookup from '../../lib/DataLookup';
import { WorkerLookup } from '../../lib/WorkerLookup';
import UserTagsSelect from './UserTagsSelect';

const ProguserForm = (props) => {
    const firstInputRef = React.useRef(null);
    console.log("allTags",props.initialValues.allTags)
    // формируем для MultiDataSelect
    props.initialValues.proguserTagIds=props.initialValues.proguserTags?.map(t=>({value:t.capClassId, title:t.capClassId}));

    React.useEffect(() => {
        setTimeout(() => {
            firstInputRef.current?.focus({
                    cursor: 'end',
            })
        }, 100);
    });

    props.internalTrigger.onBeforeSave = (values) => {
        values.proguserTags = (values.proguserTagIds || []).map(t=>({capClassId:t.value}))
        delete values.proguserTagIds;
    }

    return <Form
        {...FORM_ITEMS_LAYOUT}
        form={props.form}
        layout="horizontal"
        name="formProguser"
        onFieldsChange={props.onFieldsChange}
        initialValues={props.initialValues}>
        <Form.Item
            name='statusId'
            label='Статус'
            normalize={(value)=>parseInt(value)}
            rules={[
                { required: true }
            ]}>
            <DataSelect.CapCodeSelect capCodeType={13} 
                ref={firstInputRef} 
                onChange={(val,disp)=>{props.form.setFieldsValue({"statusDisplay":disp})}}
                displayValue={props.initialValues["statusDisplay"]}/>
        </Form.Item>
        <Form.Item
            name='proguserName'
            label='Имя (логин)'
            rules={[
                { required: true },
                { max: 50 }
            ]}>
            <Input  />
        </Form.Item>
        <Form.Item
            name='proguserFullname'
            label='Полное имя'
            rules={[
                { max: 50 }
            ]}>
            <Input  />
        </Form.Item>
        <Form.Item
            name='proguserchannelAddress'
            label='E-mail'
            rules={[
                { max: 128 },
                { type: 'email'}
                ]}>
            <Input  />
        </Form.Item>
        <Form.Item
            name='subject'
            label='ОАУ'
            >
            <DataLookup.Subject />
        </Form.Item>
        <Form.Item
            name='worker'
            label='Сотрудник'
            >
            <WorkerLookup />
        </Form.Item>

        <Form.Item
            name='proguserTagIds'
            label='Метки'
            >
            <UserTagsSelect tagmap={props.initialValues.allTags} style={{ width: "100%" }}/>
        </Form.Item>

    </Form>
}

export default ProguserForm;