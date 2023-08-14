import React,{ Suspense } from 'react';
import { EditOutlined,DeleteOutlined, LikeOutlined } from '@ant-design/icons';
import { Form, Input, Tabs, Button } from 'antd';
import MemoryDataTable from "../../lib/MemoryDataTable";
import ModuleHeader from "../../lib/ModuleHeader";
import { FilterButton } from '../../lib/FilterButton';
import { BUTTON_ADD_LABEL, BUTTON_DEL_LABEL, DEFAULT_TABLE_CONTEXT,
    FORM_ITEMS_LAYOUT,SQL_ACTIONS } from "../../lib/Const";
import { DrawBoolIcon, drawStatus,invertColor } from "../../lib/Utils";
import EditForm from "../../lib/EditForm";
import DocumentTransitForm from "./DocumentTransitForm";
import DocumentAppendixRoleForm from "./DocumentAppendixRoleForm";
import { responsiveMobileColumn, isMobile } from '../../lib/Responsive';
import DataSelect from "../../lib/DataSelect";

const MermaidChart = React.lazy(() => import('../../lib/MermaidChart'));

const { TabPane } = Tabs;

// Сущность (в CamelCase)
const ENTITY = "DocumentTransit";
const ID_NAME = ENTITY.charAt(0).toLowerCase() + ENTITY.slice(1) + "Id"
const ID_APPENDIX_NAME = "documentAppendixRoleId";

// Конвертация значений, приходящих и уходящих через API
const CONVERTORS = {
    date: []
}
const APPENDIX_CONVERTORS = {
    date: []
}

// колонки в таблице
const COLUMNS = [
    {
        title: 'Значок',
        dataIndex: 'documentTransitColor',
        render: drawStatus,
        width: "80px",
    },
    {
        title: 'Номер (Уровень)',
        dataIndex: 'documentTransitNumber',
        sorter: (a, b) => a.documentTransitNumber - b.documentTransitNumber,
        defaultSortOrder: "ascend",
        width: "80px",
        render:(number, record)=>(<>{number} ({record.documentTransitLevel})</>),
        responsive: responsiveMobileColumn()
    },
    {
        title: 'Наименование',
        dataIndex: 'documentTransitName',
        sorter: (a, b) => a.documentTransitName > b.documentTransitName ? 1 : a.documentTransitName < b.documentTransitName ? -1 : 0,
        ellipsis: true,
    },
    {
        title: 'Возможности',
        dataIndex: 'documentTransitCanedit',
        render: (val,record)=><>{record.documentTransitCanedit?<EditOutlined title='Изменение' style={{marginRight: 4}}/>:undefined}
            {record.documentTransitCandelete?<DeleteOutlined title='Удаление' style={{marginRight: 4}}/> :undefined}
            {record.documentTransitAgreeedit?<LikeOutlined title='Изменения листа согласования'/>:undefined}
        </>,
        width: "80px",
        responsive: responsiveMobileColumn()
    },
    {
        title: 'Администрирование',
        dataIndex: 'documentTransitUseadmin',
        render: DrawBoolIcon,
        width: "120px",
        responsive: responsiveMobileColumn()
    },
    {
        title: 'Запрет повторения',
        dataIndex: 'documentTransitTwicecheck',
        render: DrawBoolIcon,
        width: "120px",
        responsive: responsiveMobileColumn()
    },
    {
        title: 'Вести историю изменений',
        dataIndex: 'documentTransitFlaghistory',
        render: DrawBoolIcon,
        width: "120px",
        responsive: responsiveMobileColumn()
    },
]

const APPENDIX_COLUMNS=[
    {
        title: 'Тип материалов',
        dataIndex: 'appendixType.name',
    },
    {
        title: 'Действие',
        dataIndex: 'sqlactionId',
        width: "120px",
        render:(data)=>{
            return SQL_ACTIONS[data];
        }
    },
    {
        title: 'Роль',
        dataIndex: 'accessRole.name',
    },

]

const transformerAppendixRoleRecord = (r)=>{
    if(r.appendixType) {
        r["appendixType.name"]=r.appendixType.title;
        r["appendixType.id"]=r.appendixType.value;
        delete r.appendixType;
    }
    if(r.accessRole) {
        r["accessRole.name"]=r.accessRole.title;
        r["accessRole.id"]=r.accessRole.value;
        delete r.accessRole;
    }
}


const transformerAppendixRoleData = (data)=>{
    data.forEach(r =>
        transformerAppendixRoleRecord(r)
    );
    return data;
}


// Уникальный идентификатор формы редактировавания
const EDIT_FORM_ID = ENTITY.toLowerCase() + "-frm";
const EDIT_APPENDIX_FORM_ID = "documentappendixrole-frm";

// Форма для редактирования
const buildForm = (form, allStatuses) => {
    return <DocumentTransitForm
        form={form}
        initialValues={{}}
        allStatuses={allStatuses} />
}

// Форма для редактирования
const buildAppendixForm = (form) => {
    return <DocumentAppendixRoleForm
        form={form}
        initialValues={{}}/>
}

// размер формы, -1 - по умолчанию, FORM_MAX_WIDTH - максимальная ширина
const FORM_WIDTH = 800;

// Создание компонент для фильтров
// key это уникальное имя фильтра, попадает в REST API
const buildFilters = () => {
    return <React.Fragment>

    </React.Fragment>
}
// начальное значение фильтров
// если значение фильра не объект, а простое значение,
// то значение имени свойства компонента принимается как defaultValue компонента
const initFilters = {
}

const DocumentForm = (props) => {
    const firstInputRef = React.useRef(null);

    React.useEffect(() => {
        setTimeout(() => {
            firstInputRef.current?.focus({
                cursor: 'end',
            })
        }, 100);
    });

    // выполняется после валидацией, но до сохранения
    props.internalTrigger.onBeforeSave=(validvalues) => {
        console.log("DocumentForm validvalues",validvalues);

        // перед оправкой на сервер из плоского формата в нормальный
        const transformToServer =(rec)=>{
            if(!rec.accessRole) {
                rec.accessRole = {
                    value:rec["accessRole.id"],
                    title:rec["accessRole.name"]
                }
                delete rec["accessRole.id"]
                delete rec["accessRole.name"]
            }

            if(!rec.appendixType) {
                rec.appendixType = {
                    value:rec["appendixType.id"],
                    title:rec["appendixType.name"]
                }
                delete rec["appendixType.id"]
                delete rec["appendixType.name"]
            }

        }

        if(validvalues.appendixRoles) {
            validvalues.appendixRoles.data.forEach(r=>{
                transformToServer(r);
            })
            validvalues.appendixRoles.delta.forEach(d=>{
                transformToServer(d.record);
                if(d.oldRecord) transformToServer(d.oldRecord);
            })
        } else {
            validvalues.appendixRoles = {
                data:[],
                delta:[]
            }
        }

    };

    const buildSchema = (data)=>{
        //ищем ветления
        let branching = {};
        data.forEach(t=>{
            t.transitChildIds.forEach(prev=>{
                const br = branching[prev.value];
                if(br) {
                    br.branching = true;
                }
                branching[prev.value] = data.find(t1=>t1.documentTransitId==prev.value);
            })
        })
        // формируем состояния flowchart
        let schema = "graph LR\n"
        // сортируем по уровням, чтобы правильно сформировать subgraph
        data = data.sort((t1,t2)=>t1.documentTransitLevel-t2.documentTransitLevel);
        let currentLevel = -1;
        let countLevel = 0;
        data.forEach(t=>{
            const lf = t.branching?'{':'(';
            const rf = t.branching?'}':')';
            if(currentLevel!=t.documentTransitLevel) {
                //дабавляем фиктивный subgraph для отступа (workaround)
                if(currentLevel>-1) {
                    schema+=`subgraph l${t.documentTransitLevel}-pad[ ]\n`;
                    schema+=`style l${t.documentTransitLevel}-pad stroke-dasharray: 0 1\n`;
                    countLevel++;
                }
                schema+=`subgraph l${t.documentTransitLevel}[Уровень ${t.documentTransitLevel}]\n`;
                currentLevel=t.documentTransitLevel;
                countLevel++;
            }
            schema+=`${t.documentTransitId}${lf}${t.documentTransitName}${rf}\n`;
        })
        for (let i = 0; i < countLevel; i++) {
            schema+=`end\n`;
        }
        // формируем связи flowchart
        data.forEach(t=>{
            const lastStatus = t.documentTransitNumber>1 && !branching[t.documentTransitId];
            const lc = lastStatus?'((':'(';
            const rc = lastStatus?'))':')';

            t.transitChildIds.forEach(prev=>{
                const prevRec = data.find(t1=>t1.documentTransitId==prev.value);
                const lf = prevRec.branching?'{':'(';
                const rf = prevRec.branching?'}':')';

                schema+=`${prev.value}${lf}${prev.title}${rf} --> ${t.documentTransitId}${lc}${t.documentTransitName}${rc}\n`;
            })
        })

        // добавляем стили
        data.forEach(t=>{
            const bgcolor = "#" + (+t.documentTransitColor).toString(16).padStart(6, '0');
            const stroke = invertColor(bgcolor,true);
            schema+=`style ${t.documentTransitId} fill:${bgcolor},color:${stroke}\n`
        });
        return schema;
    }

    const refreshSchema = ()=>{
        const sma = buildSchema(props.form.getFieldValue("transits").data);
        console.log(sma);
        setTransitSchema(sma);
    }

    let [formVisible, setFormVisible] = React.useState(false);
    let [appendixFormVisible, setAppendixFormVisible] = React.useState(false);
    let [editorContext] = React.useState({});
    const [tableInterface] = React.useState(Object.assign({}, DEFAULT_TABLE_CONTEXT));
    const [tableAppendixInterface] = React.useState(Object.assign({}, DEFAULT_TABLE_CONTEXT));
    const [form] = Form.useForm();
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    const [updateRecords, setUpdateRecords] = React.useState([]);
    const [transitSchema,setTransitSchema] = React.useState("");

    // конвертируем в плоскую структуру
    if(props.initialValues.appendixRoles) {
        transformerAppendixRoleData(props.initialValues.appendixRoles.data);
    }

    const getMaxAppendixRolePosNumber = React.useCallback(() => {
        const numbers = props.form.getFieldValue("appendixRoles").data.map(r=>r.posNumber);
        if(numbers.length==0) {
            return 1;
        }
        return Math.max(...numbers);
    }, [props.form])

    const setFilters = React.useCallback((config) => {
        tableInterface.requestParams.filters = config;
        tableInterface.refreshData();
    }, [tableInterface])


    const callForm = React.useCallback((id, record) => {
        editorContext.id = id;
        editorContext.record = record;
        setFormVisible(true);
    }, [editorContext])

    const callAppendixForm = React.useCallback((id, record) => {
        editorContext.id = id;
        editorContext.record = record;
        setAppendixFormVisible(true);
    }, [editorContext])

    // тут формируются кнопки
    const buttons = [
        <Button key="del" disabled={tableInterface.isLoading() || tableInterface.getSelectedRows().length == 0}
            onClick={() => {
                const delIds = tableInterface.getSelectedRecords().map(record => record.record["documentTransitId"]);
                tableInterface.memoryDataSet.data.forEach(value => {
                    const newTransitChildIds = value.record.transitChildIds.filter(el => delIds.indexOf(el.value) === -1);
                    if (value.record.transitChildIds.length !== newTransitChildIds.length) {
                        const newValue = value.record;
                        newValue.transitChildIds = newTransitChildIds;
                        tableInterface.updateRecord(newValue);
                    }
                });

                tableInterface.deleteData();
            }}>{BUTTON_DEL_LABEL}</Button>,
        <Button key="add" onClick={() => callForm(undefined, {
            accessRoleIds: [],
            documentTransitAgreeedit: 0,
            documentTransitCandelete: 0,
            documentTransitCanedit: 0,
            documentTransitColor: 16007990, // Первый цвет по умолчанию
            documentTransitFlaghistory: 0,
            documentTransitFlagone: 0,
            documentTransitLevel: tableInterface.getNextInField("documentTransitLevel"),
            documentTransitLocksubj: 0,
            documentTransitName: null,
            documentTransitNumber: tableInterface.getNextInField("documentTransitNumber"),
            documentTransitRequired: 0,
            documentTransitTwicecheck: 0,
            documentTransitUseadmin: 0,
            transitChildIds: []
        })} type="primary">{BUTTON_ADD_LABEL}</Button>
    ];
    const appendixButtons = [
        <Button key="del" disabled={tableAppendixInterface.isLoading() || tableAppendixInterface.getSelectedRows().length == 0}
            onClick={() => {
                tableAppendixInterface.deleteData();
            }}>{BUTTON_DEL_LABEL}</Button>,
        <Button key="add" onClick={() => callAppendixForm(undefined,{})} type="primary">{BUTTON_ADD_LABEL}</Button>
    ]


    if (isMobile()) {
        const filters = buildFilters();
        buttons.push(<FilterButton key="filter" filters={filters}
            onChange={(fc) => setFilters(fc)}
            initValues={initFilters} />);
    }

    const afterEdit = React.useCallback((values) => {
        tableInterface.updateRecord(values);
        setUpdateRecords([...updateRecords, values])
    }, [tableInterface, updateRecords])

    const afterAdd = React.useCallback((values) => {
        tableInterface.insFirstRecord(values);
        setUpdateRecords([...updateRecords, values])
    }, [tableInterface, updateRecords])

    const afterAppendixRoleEdit = React.useCallback((values) => {
        transformerAppendixRoleRecord(values);
        tableAppendixInterface.updateRecord(values);
        setUpdateRecords([...updateRecords, values])
    }, [tableAppendixInterface, updateRecords])

    const afterAppendixRoleAdd = React.useCallback((values) => {
        values.posNumber = getMaxAppendixRolePosNumber()+1;
        transformerAppendixRoleRecord(values);
        tableAppendixInterface.insFirstRecord(values);
        setUpdateRecords([...updateRecords, values])
    }, [tableAppendixInterface, updateRecords,getMaxAppendixRolePosNumber])

    return <Form
        {...FORM_ITEMS_LAYOUT}
        form={props.form}
        layout="horizontal"
        name="formDocument"
        onFieldsChange={props.onFieldsChange}
        initialValues={props.initialValues}>
        <Form.Item
            name='documentName'
            label='Наименование'
            rules={[
                { required: true },
                { max: 50 }
            ]}>
            <Input disabled={true} />
        </Form.Item>
        <Form.Item
            name='uniqueTypeId'
            label='Уникальность'>
            <DataSelect
                ref={firstInputRef}
                uri={"system/uniquetype/getlist"}
                valueName="uniqueTypeId"
                displayValueName="uniqueTypeName"
                onChange={(val,disp)=>{props.form.setFieldsValue({"uniqueTypeName":disp})}}                                
                displayValue={props.initialValues["uniqueTypeName"]}
                allowClear={true}
            />
        </Form.Item>
        <Tabs defaultActiveKey="transits" onChange={(key)=>{
            if(key=='schema') {
                refreshSchema();
            }
        }}>
            <TabPane tab="Статусы" key="transits">
                <ModuleHeader
                    title={""}
                    showBackButton={false}
                    showButtonsInMobile={true}
                    search={false}
                    buttons={buttons}
                />
                <Form.Item
                    name='transits'
                    wrapperCol={{ offset: 0 }}>
                    <MemoryDataTable className="mod-main-table"
                        columns={COLUMNS}
                        editCallBack={(record) => callForm(record[ID_NAME], record)}
                        interface={tableInterface}
                        onSelectedChange={() => forceUpdate()}
                        onAfterRefresh={() => setUpdateRecords([])}
                        updateRecords={updateRecords}
                        idName={ID_NAME}
                    />
                </Form.Item>
                <EditForm
                    id={EDIT_FORM_ID}
                    copyButtonFlag={true}
                    visible={formVisible}
                    form={form}
                    width={FORM_WIDTH}
                    editorContext={editorContext}
                    afterSave={(response) => {
                        setFormVisible(false);
                        if (response) {
                            if (!editorContext.id) {
                                afterAdd(response)
                            } else {
                                afterEdit(response)
                            }
                        }
                    }}
                    afterCopy={afterAdd}
                    afterCancel={() => {
                        setFormVisible(false);
                    }}
                    idName={ID_NAME}
                    convertors={CONVERTORS}>
                    {buildForm(form, props.form.getFieldValue("transits"))}
                </EditForm>
            </TabPane>
            <TabPane tab="Схема" key="schema">
                <Suspense fallback={<div>Загрузка...</div>}>
                    <MermaidChart chart={transitSchema} height={"calc(100vh - 330px)"}/>
                </Suspense>
            </TabPane>
            <TabPane tab="Электронные материалы" key="appendix">
                <ModuleHeader
                        title={""}
                        showBackButton={false}
                        showButtonsInMobile={true}
                        search={false}
                        buttons={appendixButtons}
                    />
                <Form.Item
                    name='appendixRoles'
                    wrapperCol={{ offset: 0 }}>
                    <MemoryDataTable className="mod-main-table"
                        columns={APPENDIX_COLUMNS}
                        editCallBack={(record) => callAppendixForm(record[ID_APPENDIX_NAME], record)}
                        interface={tableAppendixInterface}
                        onSelectedChange={() => forceUpdate()}
                        onAfterRefresh={() => setUpdateRecords([])}
                        transformerData={transformerAppendixRoleData}
                        updateRecords={updateRecords}
                        idName={ID_APPENDIX_NAME}
                    />
                </Form.Item>
                <EditForm
                    id={EDIT_APPENDIX_FORM_ID}
                    copyButtonFlag={true}
                    visible={appendixFormVisible}
                    form={form}
                    width={FORM_WIDTH}
                    editorContext={editorContext}
                    afterSave={(response) => {
                        setAppendixFormVisible(false);
                        if (response) {
                            if (!editorContext.id) {
                                afterAppendixRoleAdd(response)
                            } else {
                                afterAppendixRoleEdit(response)
                            }
                        }
                    }}
                    afterCopy={afterAppendixRoleAdd}
                    afterCancel={() => {
                        setAppendixFormVisible(false);
                    }}
                    idName={ID_APPENDIX_NAME}
                    transformerData={transformerAppendixRoleRecord}
                    convertors={APPENDIX_CONVERTORS}>
                    {buildAppendixForm(form)}
                </EditForm>

            </TabPane>

        </Tabs>
    </Form>
}

export default DocumentForm;
