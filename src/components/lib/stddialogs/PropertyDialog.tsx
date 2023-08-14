import React, {FC} from 'react';
import { Table, Modal } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { Tabs } from 'antd';
import {objectWithAnyFields} from "../types";

const { TabPane } = Tabs;


export const showPropertyDialog = (record: any, columns: any[], tableInterface: objectWithAnyFields) => {
    const data = Object.keys(record).map(k => {
        const col = columns.find(c => c.dataIndex == k);
        return {
            key: k,
            dataIndex: k,
            visible: col != null,
            name: (col || {}).title,
            value: record[k]
        }
    })
    const tableprop = tableInterface.getProperties();
    Modal.info({
        centered:true,
        title: 'Свойства таблицы',
        width: "calc(100vw - 80px)",
        content: (
            <Tabs defaultActiveKey="1" style={{height: '520px'}}>
                {tableprop.props.uri && tableprop.props.uri.forSelect && (
                    <TabPane tab="Общие" key="1">
                        <div>Точка доступа: <b>{tableprop.props.uri.forSelect}</b></div>
                        <div>Параметры: <pre>{JSON.stringify(tableprop.props.interface.requestParams, null, 2)}</pre></div>
                    </TabPane>
                )}
                <TabPane tab="Список полей" key="2">
                    <Table
                        pagination={{ pageSize: 5}}
                        columns={[
                            {
                                title: 'Программное имя',
                                dataIndex: 'dataIndex',
                                ellipsis:true
                            },
                            {
                                title: 'Видимость',
                                dataIndex: 'visible',
                                render: (data) => data ? <CheckOutlined /> : "",
                                width:'80px'
                            },
                            {
                                title: 'Наименование',
                                dataIndex: 'name'
                            },
                            {
                                title: 'Значение',
                                dataIndex: 'value',
                                ellipsis:true
                            },
                        ]}
                        dataSource={data}
                    />

                </TabPane>
            </Tabs>

        )
    });
}
