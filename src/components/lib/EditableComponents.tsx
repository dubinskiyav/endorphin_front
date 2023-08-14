import React, {useContext, useState, useEffect, useRef, FC} from 'react';
import {Form, FormInstance, Input, InputNumber} from 'antd';
import { DateInput } from './DateInput';
import withStyles, {WithStylesProps} from "react-jss";
const EditableContext = React.createContext<FormInstance | null>(null);

interface EditableRowProps {
    index: number,
    [x:string|number]: any
}

export const EditableRow: FC<EditableRowProps> = ({ index, ...props }) => {
    const [form] = Form.useForm();
    return (
        <Form form={form} component={false}>
            <EditableContext.Provider value={form}>
                <tr {...props} />
            </EditableContext.Provider>
        </Form>
    );
};

// JSS. Стили компонента
const styles = {
    'editable-cell-value-wrap':{
        padding: '5px 12px',
        cursor: 'pointer'
    }
}

interface EditableCellProps extends WithStylesProps<typeof styles> {
    index?: number,
    title?: string,
    editable?: boolean,
    children?: React.ReactNode,
    dataIndex: string,
    record?: any,
    handleSave: (value: any) => void,
    editComponentName?: string,
    required?: boolean,
    [x:string]: any
}

const EditableCellImpl: FC<EditableCellProps> = ({
    title,
    editable,
    children,
    dataIndex,
    record,
    handleSave,
    editComponentName,
    required,
    classes,
    ...restProps
}) => {
    const [editing, setEditing] = useState(false);
    const inputRef = useRef<any>(null);
    const form = useContext(EditableContext);
    useEffect(() => {
        if (editing) {
            inputRef.current.focus();
        }
    }, [editing]);

    const toggleEdit = () => {
        setEditing(!editing);
        if (form) {
            form.setFieldsValue({
                [dataIndex]: record[dataIndex],
            });
        }

    };

    const save = async (e: any) => {
        if (e && e.stopPropagation) e.stopPropagation();
        try {
            if (form) {
                const values = await form.validateFields();
                console.log(values);
                toggleEdit();
                handleSave({ ...record, ...values });
            }
        } catch (errInfo) {
            console.log('Save failed:', errInfo);
        }
    };

    let childNode = children;

    if (editable) {
        childNode = editing ? (
            <Form.Item
                style={{
                    margin: 0,
                }}
                name={dataIndex}
                rules={[
                    {
                        required: required,
                        message: `${title} обязательно для заполнения`,
                    },
                ]}
            >
                {
                    editComponentName === "InputNumber"
                        ? <InputNumber parser={(s: any) => parseInt(s)} ref={inputRef} onPressEnter={save} onBlur={save} />
                        : editComponentName === "DateInput"
                            ? <DateInput format="DD.MM.YYYY HH:mm" showTime={true} allowClear={false} ref={inputRef} open={true} onOk={save} onBlur={save} />
                            : <Input ref={inputRef} onPressEnter={save} onBlur={save} />
                }
            </Form.Item>
        ) : (
            <div
                className={classes['editable-cell-value-wrap']}
                onClick={toggleEdit}>
                {children}
            </div>
        );
    }

    return <td {...restProps}>{childNode}</td>;
};

export const EditableCell = withStyles(styles)(EditableCellImpl)
