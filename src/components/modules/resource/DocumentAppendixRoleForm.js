import React from 'react';
import { Form, Radio, Input } from 'antd';
import { FORM_ITEMS_LAYOUT,SQL_ACTIONS } from "../../lib/Const";
import DataSelect from "../../lib/DataSelect";

const DocumentAppendixRoleForm = (props) => {
    const firstInputRef = React.useRef(null);
    const [appendixTypeInterface] = React.useState({});
    const [accessRoleInterface] = React.useState({});

    React.useEffect(() => {
        setTimeout(() => {
            firstInputRef.current.focus({
                    cursor: 'end',
            })
        }, 100);
    });

    return <Form
        {...FORM_ITEMS_LAYOUT}
        form={props.form}
        layout="horizontal"
        name="formDocumentAppendixRole"
        onFieldsChange={(changedFields,allFields)=>{
            changedFields.forEach(f=>{
                // appendixType.name отображается в таблице, связанной с MemoryDataSet
                // поэтому tuj нужно поменять, так как оно зависит от appendixType.id
                if(f.name[0]=="appendixType.id") {
                    const val = appendixTypeInterface.getDisplayValue(f.value);
                    props.form.setFieldsValue({"appendixType.name":val});
                }
                // appendixType.name отображается в таблице, связанной с MemoryDataSet
                // поэтому tuj нужно поменять, так как оно зависит от appendixType.id
                if(f.name[0]=="accessRole.id") {
                    const val = accessRoleInterface.getDisplayValue(f.value);
                    props.form.setFieldsValue({"accessRole.name":val});
                }
            });
            props.onFieldsChange();
        }}
        initialValues={props.initialValues}>
        <Form.Item
            hidden
            name='posNumber'>
                <Input/>
        </Form.Item>
        <Form.Item
            name='appendixType.id'
            label='Тип электронных материалов'
            rules={[
                { required: true }
            ]}>
            <DataSelect.CapClassSelect capClassType={76} ref={firstInputRef} 
                    onChange={(val,disp)=>{props.form.setFieldsValue({"appendixType.name":disp})}}                
                    displayValue={props.initialValues["appendixType.name"]} interface={appendixTypeInterface}
                    style={{width:"100%"}}/>
        </Form.Item>
        <Form.Item
            hidden
            name='appendixType.name'>
                <Input/>
        </Form.Item>
        <Form.Item
            name='sqlactionId'
            label='Действие'
            rules={[
                { required: true }
            ]}>            
            <Radio.Group buttonStyle="solid">
                <Radio.Button value={1}>{SQL_ACTIONS[1]}</Radio.Button>
                <Radio.Button value={2}>{SQL_ACTIONS[2]}</Radio.Button>
                <Radio.Button value={3}>{SQL_ACTIONS[3]}</Radio.Button>
                <Radio.Button value={4}>{SQL_ACTIONS[4]}</Radio.Button>
            </Radio.Group>
        </Form.Item>
        <Form.Item
            name='accessRole.id'
            label='Роль'
            rules={[
                { required: true }
            ]}>
            <DataSelect 
                    uri={"admin/credential/accessrole/getlist"} 
                    params={{
                        "pagination": {
                            "current": 1,
                            "pageSize": -1
                        },
                        "sort": [
                            {
                                "field": "accessRoleName",
                                "order": "ascend"
                            }
                        ]
                    }}
                    valueName="accessRoleId"
                    displayValueName="accessRoleName"
                    onChange={(val,disp)=>{props.form.setFieldsValue({"accessRole.name":disp})}}                
                    displayValue={props.initialValues["accessRole.name"]} interface={accessRoleInterface}/>
        </Form.Item>
        <Form.Item
            hidden
            name='accessRole.name'>
                <Input/>
        </Form.Item>
    </Form>
}

export default DocumentAppendixRoleForm;