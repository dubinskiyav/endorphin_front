import React from 'react';
import { Form, Input, Checkbox } from 'antd';
import { FORM_ITEMS_LAYOUT } from "../../lib/Const";
import { intFlagFromCheckboxEvent } from "../../lib/Utils";
import { ColorPicker } from '@programmerraj/rc-color-picker';
import '@programmerraj/rc-color-picker/assets/index.css';
import TinyColor from 'tinycolor2';

const toTinyColor = (value) => {
    return value ? 
            {color: new TinyColor(`#${value.toString(16).padStart(6, '0')}`), open: false} :
            {color: new TinyColor("#FFFFFF"), open: false};
};

const CapClassLabelForm = (props) => {
    const firstInputRef = React.useRef(null);    

    props.initialValues.capClassValueTinyColor = toTinyColor(props.initialValues.capClassValue);

    React.useEffect(() => {
        setTimeout(() => {
          if (firstInputRef.current) {
            firstInputRef.current.focus({
              cursor: 'end',
            });
          }        
        }, 100);
    }, []);

    props.internalTrigger.onBeforeSave=(validValues) => {
        validValues.capClassValue = parseInt(validValues.capClassValueTinyColor.color.toString().slice(1), 16);               
    }
          
    return <Form
        {...FORM_ITEMS_LAYOUT}
        form={props.form}
        layout="horizontal"
        name="formCapClass"
        onFieldsChange={props.onFieldsChange}
        initialValues={props.initialValues}>
        <Form.Item
            name='capClassTypeId'
            hidden={true}>
            <Input />
        </Form.Item>
        <Form.Item
            name='capClassCode'
            label='Код'
            rules={[
                { required: true },
                { max: 20 }
            ]}>
            <Input ref={firstInputRef} />
        </Form.Item>
        <Form.Item
            name='capClassName'
            label='Наименование'
            rules={[
                { required: true },
                { max: 255 }
            ]}>
            <Input />            
        </Form.Item>               
         <Form.Item            
            name='capClassValueTinyColor'
            label='Цвет метки'
            rules={[
                { required: false }                
            ]}>
            <ColorPicker              
                animated={true}
                enableAlpha={false}/>                
        </Form.Item>
        <Form.Item
            name='capClassRemark'
            label='Примечание'
            rules={[
                { max: 255 }
            ]}>
            <Input />
        </Form.Item>
        <Form.Item
            name='capClassBlockflag'
            label='Блокировка'
            valuePropName='checked'
            getValueFromEvent={intFlagFromCheckboxEvent}
            rules={[
            ]}>
            <Checkbox />
        </Form.Item>
    </Form>
}

export default CapClassLabelForm;