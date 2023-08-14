import React from 'react';
import { Form, Input, Radio } from 'antd';
import { FORM_ITEMS_LAYOUT } from "../../lib/Const";
import {DateInput} from "../../lib/DateInput";


const WorkerForm = (props) => {
    const firstInputRef = React.useRef(null);

    React.useEffect(() => {
        setTimeout(() => {
            if (firstInputRef.current) {
                firstInputRef.current.focus({
                    cursor: 'end',
                })
            }
        }, 100);
    });

    return <Form
        {...FORM_ITEMS_LAYOUT}
        form={props.form}
        layout="horizontal"
        name="formWorker"
        onFieldsChange={props.onFieldsChange}
        initialValues={props.initialValues}>
        <Form.Item
            name='workerTabnumber'
            label='Табельный номер'
            rules={[
                { required: true },
                { max: 15 }
            ]}>
            <Input ref={firstInputRef} />
        </Form.Item>
        <Form.Item
            name='workerFamilyname'
            label='Фамилия'
            rules={[
                { required: true },
                { max: 30 }
            ]}>
            <Input  />
        </Form.Item>
        <Form.Item
            name='workerFirstname'
            label='Имя'
            rules={[
                { required: true },
                { max: 30 }
            ]}>
            <Input  />
        </Form.Item>
        <Form.Item
            name='workerSurname'
            label='Отчество'
            rules={[
                { max: 30 }
            ]}>
            <Input  />
        </Form.Item>
        <Form.Item
            name='workerSex'
            label='Пол'
            rules={[
                { required: true }
            ]}>
            <Radio.Group buttonStyle="solid">
              <Radio.Button value={0}>Мужской</Radio.Button>
              <Radio.Button value={1}>Женский</Radio.Button>
            </Radio.Group>
        </Form.Item>
        <Form.Item
            name='workerBirthday'
            label='Дата рождения'
            rules={[

            ]}>
            <DateInput  />
        </Form.Item>
        <Form.Item
            name='workerEmail'
            label='Электронная почта'
            rules={[
                { max: 50 }
            ]}>
            <Input  />
        </Form.Item>
        <Form.Item
            name='workerHomephone'
            label='Домашний телефон'
            rules={[
                { max: 50 }
            ]}>
            <Input  />
        </Form.Item>
        <Form.Item
            name='workerWorkphone'
            label='Рабочий телефон'
            rules={[
                { max: 50 }
            ]}>
            <Input  />
        </Form.Item>
        <Form.Item
            name='workerContactphone'
            label='Контактный телефон'
            rules={[
                { max: 50 }
            ]}>
            <Input  />
        </Form.Item>
        <Form.Item
            name='workerRemark'
            label='Примечание'
            rules={[
                { max: 255 }
            ]}>
            <Input  />
        </Form.Item>
    </Form>
}

export default WorkerForm;
