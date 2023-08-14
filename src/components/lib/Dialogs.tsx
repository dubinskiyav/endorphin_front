import React from 'react';
import { Modal, Input, Form } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { resq$ } from 'resq';
import { ShowModal } from './EditForm';


/**
 * Диалог в двумя кнопками
 * @param {*} title
 * @param {*} okClick
 */
export const confirm = (title: string, okClick: any) => {
    Modal.confirm({
        title: title,
        centered: true,
        icon: <ExclamationCircleOutlined />,
        onOk: okClick
    });
}

const handleKeyDown = (ev: any) => {
    if (ev.which == 13) {
        let root: HTMLCollectionOf<Element> = document.getElementsByClassName("ant-modal-root");
        const okBtn = (resq$('Button', root[0] as HTMLElement) as any).byProps({ type: "primary" });
        okBtn.props.onClick(okBtn);
    }
}

/**
 * Диалог c полем ввода и двумя кнопками
 * @param {*} title
 * @param {*} text - placeholder строки ввода
 * @param {*} getValueFn - вызывается, когда осуществляется ввод. 
 * Аргумент - введенная величина
 */
export const inputValue = (title: any, text: string, getValueFn: (value: any) => void, defaultValue:string='') => {
    let _flt_node: any;

    const handleGetInputRef = (node: any) => {
        _flt_node = node;
        if (node != null) {
            setTimeout(() => {
                node.focus();
            }, 100);
        }
    }

    Modal.confirm({
        title: title,
        centered: true,
        content: <div onKeyDown={handleKeyDown}><Input ref={handleGetInputRef} placeholder={text} defaultValue={defaultValue} /></div>,
        onOk: (closeFn) => {
            const val = _flt_node.input.value;
            if (!val || val == '') {
                return;
            }
            getValueFn(val);
            closeFn();
        }
    });
}

/**
 * Диалог c произвольным содержимым и двумя кнопками
 * @param {*} title
 * @param {*} comp - произвольный компонент
 * @param {*} getValueFn - вызывается, когда осуществляется ввод. 
 * Аргумент - элемент DOM в котором содержится элементы смонтированного компонета comp
 * Если функция  вернет true диалог закроется
 */
export const inputData = (title:any, comp:any, getValueFn: (elem: Element) => boolean) => {
    const fid = Math.floor(Math.random() * 10000);

    Modal.confirm({
        title: title,
        centered: true,
        content: <div id={"c"+fid} onKeyDown={handleKeyDown}>{comp}</div>,
        onOk: (closeFn) => {
            const rootelem:Element = document.querySelector("#c"+fid)!;
            if (getValueFn(rootelem)) {
                closeFn();
            }
        }
    });

}  


let topLayerComponents:any[] = [];

interface EditorContextProps {
    uriForSave?:string | ((values: object)=>Promise<any>),
    uriForGetOne?:string | ((id: number | string)=>Promise<any>),
    id?:number | string,
    record?:any,
    // дополнительные свойтсва перекрывающие DialogProps
    title?:string,
    initialValues?:any,
    width?:string
}

/**
 * Создает конфигурация для диалога
 *
 */
interface DialogProps {
    dialogId?:string,
    title: string,
    content: React.ReactNode,
    width?: number | string,
    idName?:string,
    convertors?:any,
    modeCopy?:boolean,
    initialValues?:any,
    afterSave?:(response:any)=>void,
    okBtnCaption?:string,
    beforeSave?:(values:any)=>boolean
}

type DialogFunc = (ctx:EditorContextProps)=>void;

export const useDialog = ({ title, content, width,idName,convertors,modeCopy,initialValues,afterSave,dialogId,okBtnCaption,beforeSave }: DialogProps):DialogFunc => {
    const [form] = Form.useForm();
    const [optionsDlg]:any[] = React.useState({
        form,
        title,
        content,
        dialogId,width,idName,convertors,modeCopy,initialValues,afterSave,okBtnCaption,beforeSave,
        destroyDialog:(dlgId:string) => {
            form.resetFields();
            let newlayers = [...topLayerComponents.filter(c => c.props.id != dlgId)];
            (newlayers as any).forceUpdate = (topLayerComponents as any).forceUpdate;
            topLayerComponents = newlayers;
            (topLayerComponents as any).forceUpdate();
        }
    });

    return (editorContext: EditorContextProps)=>{
        optionsDlg.editorContext = editorContext;
        if(editorContext.title) {
            optionsDlg.title = editorContext.title;
        }
        if(editorContext.initialValues) {
            optionsDlg.initialValues = editorContext.initialValues;
        }
        if(editorContext.width) {
            optionsDlg.width = editorContext.width
        }
        optionsDlg.form.resetFields(); //для сброса предудыщих значений полей
        const dialog = ShowModal(optionsDlg);
        topLayerComponents.push(dialog);
        if(!(topLayerComponents as any).forceUpdate) {
            console.error('Component TopLayer not found in current page. Use <TopLayer/>')
            return;
        }
        (topLayerComponents as any).forceUpdate();
    }
}

export const TopLayer=()=>{
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    (topLayerComponents as any).forceUpdate = forceUpdate;
    return <>{topLayerComponents.map(itm=>itm)}</>
}