import React, {FC} from 'react';
import { Menu, notification, Form } from 'antd';
import Status from "./Status";
import { ShowModal } from './EditForm';
import moment from 'moment';
import { getItemFromLocalStorage, refreshStatusList } from './Utils';
import DocumentRealTransitForm from "./DocumentRealTransitForm";
import { DocumentRealTransits } from "./DocumentRealTransits";

const { SubMenu } = Menu;

// Конвертация значений, приходящих и уходящих через API
const CONVERTORS = {
    date: ["documentRealTransitDate"]
}

let documentTransit: any;

interface DocStatusCenterProps {
    documentId?: number,
    selectedRecords: any[],
    idName: number,
    topLayer?: any,
    setTopLayer?: (value: any) => void,
    forceUpdate?: () => void
}

const DocStatusCenter: FC<DocStatusCenterProps> = ({...props}) => {
    const documentId = props.documentId;
    const selectedRecords = props.selectedRecords;
    const idName = props.idName;
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    const topLayer = props.topLayer;
    const setTopLayer = props.setTopLayer;
    const [form] = Form.useForm();

    if (documentTransit === undefined) {
        documentTransit = JSON.parse(getItemFromLocalStorage("documentTransit") || '{}');
        if (!documentTransit) {
            refreshStatusList((response: any) => {
                documentTransit = response;
                forceUpdate();
            });
        }
    }

    // Найдем ID текущего статуса и проверим что он одинаковый у всех записей. Если нет, то блокируем меню "Статусы"
    let documentTransitId: any;
    const onlyUnique = (value: any, index: any, self: any) => self.indexOf(value) === index;
    const uniqueDocumentTransitId = selectedRecords.map(val => val.documentRealStatus).filter(onlyUnique);
    if (uniqueDocumentTransitId.length === 1)
        documentTransitId = uniqueDocumentTransitId[0];

    const setStatus = (status: any, isSetStatus: boolean) => {
        const config = {
            topLayer,
            setTopLayer,
            form,
            destroyDialog: (dlgId: any) => {
                if (topLayer !== undefined && setTopLayer !== undefined) setTopLayer([...topLayer.filter((c: any) => c.props.id != dlgId)]);
            },
            editorContext: {
                record: {
                    documentRealTransitDate: moment(),
                    documentRealIds: selectedRecords.map(value => value[idName]),
                    documentTransitId: status.documentTransitId,
                    documentTransitName: status.documentTransitName,
                },
                uriForSave: isSetStatus ? "documents/documentreal/documentrealtransit/set" : "documents/documentreal/documentrealtransit/unset",
            },
            convertors: CONVERTORS,
            afterSave: (response: any) => {
                if (response) {
                    response.forEach((value: any) => {
                        selectedRecords.forEach((el, index, arr) => {
                            if (el[idName] === value.documentRealId) {
                                arr[index].documentTransitColor = value.documentTransitColor;
                                arr[index].documentTransitName = value.documentTransitName;
                                arr[index].documentRealStatus = value.documentTransitId;
                            }
                        })
                    })
                    if (props.forceUpdate) props.forceUpdate();
                    notification.success({ message: isSetStatus ? "Статус успешно установлен" : "Статус успешно снят" })
                }
            }
        };
        // формируем диалог
        const dialog = ShowModal({
            ...config,
            title: isSetStatus ? "Установка статуса" : "Снятие статуса",
            content: <DocumentRealTransitForm isSetStatus={isSetStatus} />,
            width: 688
        });
        // вставляем Modal в top layer
        if (config.setTopLayer !== undefined && config.topLayer !== undefined) config.setTopLayer([...config.topLayer, dialog]);
    }

    const refreshStatus = () => {
        documentTransitId = undefined;
        localStorage.removeItem("documentTransit");
        forceUpdate();
    }

    const showStatusInfo = () => {
        const config = {
            topLayer,
            setTopLayer,
            form,
            destroyDialog: (dlgId: any) => {
                if (topLayer !== undefined && setTopLayer !== undefined) setTopLayer([...topLayer.filter((c: any) => c.props.id != dlgId)]);
            },
            editorContext: {
                record: {
                    documentRealId: selectedRecords[0][idName]
                }
            },
            modeCopy: true
        };
        // формируем диалог
        const dialog = ShowModal({
            ...config,
            title: "Информация о статусах документа",
            content: <DocumentRealTransits documentRealId={selectedRecords[0][idName]} />,
        });
        // вставляем Modal в top layer
        if (config.setTopLayer !== undefined && config.topLayer !== undefined) config.setTopLayer([...config.topLayer, dialog]);
    }

    const transits: JSX.Element[] = [] ;
    ((documentTransit && documentId && documentTransit[documentId]) ?? []).forEach((val: any) => {
        const setEnabled = (documentTransitId === 0 && val.transitChildIds.length === 0)
            || val.transitChildIds.indexOf(documentTransitId) !== -1
            || (!val.documentTransitTwicecheck && documentTransitId === val.documentTransitId);
        const unSetEnabled = documentTransitId === val.documentTransitId;
        transits.push(
            <SubMenu
                key={"status." + val.documentTransitId}
                icon={<span className="anticon"><Status color={"#" + (val.documentTransitColor).toString(16).padStart(6, '0')}  /></span>}
                title={val.documentTransitName}
                disabled={!setEnabled && !unSetEnabled}>
                <Menu.Item disabled={!setEnabled} key={"status." + val.documentTransitId + ".set"} onClick={() => setStatus(val, true)}>Установить</Menu.Item>
                <Menu.Item disabled={!unSetEnabled} key={"status." + val.documentTransitId + ".remove"} onClick={() => setStatus(val, false)}>Снять</Menu.Item>
            </SubMenu>
        );
    });

    return (
        <Menu>
            <SubMenu key={"status"} title="Статусы" disabled={documentTransitId === undefined}>
                {transits}
            </SubMenu>
            <Menu.Item key="statusInfo" onClick={showStatusInfo}>Информация о статусах документа</Menu.Item>
            <Menu.Item key="statusRefresh" onClick={refreshStatus}>Обновить статусы</Menu.Item>
            <Menu.Divider />
        </Menu>
    )
};


export default DocStatusCenter;
