import React from 'react';
import { Button, Modal, Space, notification, Input } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';

import {DataTree} from "../DataTree";
import DataTable from "../DataTable";
import { DEBOUNCE_TIMEOUT } from '../Const';
import { debounce } from "../Utils";
import {objectWithAnyFields} from "../types";
import {jss} from "react-jss";
import 'react-splitter-layout/lib/index.css';
// @ts-ignore
import SplitterLayout from "react-splitter-layout";



export const tableInterface: objectWithAnyFields = { isLoading: () => false, getSelectedRows: () => [] };


let historyJump: any[] = [];
let historyCurrent = 0;
const treeInterface: objectWithAnyFields = {};



export const chooseSGood = (finalyCB: any) => {
    historyJump = [-1];
    historyCurrent = 0;

    const styles = {
        backButton: {
            border: 0,
            background: "transparent",
            padding: 0,
            lineHeight: 'inherit',
            display: 'inline-block',
        }
    }

    const {classes} = jss.createStyleSheet(styles).attach()
    const handleSelect = (selectedKeys: any, obj: any, jumpFlag: boolean) => {
        if(!jumpFlag) {
            putToHistory(selectedKeys[0]);
        }
        tableInterface.requestParams.filters["parentId"] = selectedKeys[0];
        tableInterface.refreshData();
    }

    const checkInput = (closeFunc: () => any) => {
        if (tableInterface.getSelectedRows().length > 0) {
            const rec = tableInterface.getSelectedRecords()[0];
            finalyCB(true,rec);
            closeFunc();
            return;
        }
        notification.error({
            message: "Необходимо выбрать объект"
        })
    }

    const handleHistoryBack = () => {
        if(historyCurrent>0) {
            historyCurrent--
            treeInterface.jump(historyJump[historyCurrent]);
        }
    }

    const handleHistoryNext = () => {
        if(historyCurrent<historyJump.length-1) {
            historyCurrent++
            treeInterface.jump(historyJump[historyCurrent]);
        }
    }

    const putToHistory = (recordId: number | string | undefined) => {
        if(historyCurrent<historyJump.length-1) {
            historyJump.splice(historyCurrent+1,historyJump.length,recordId);
        } else {
            historyJump.push(recordId);
        }
        historyCurrent = historyJump.length-1;
    }

    const handleSearchTree =(ev: any) => {
        const { value } = ev.target;
        treeInterface.search(value);
    }


    const resetSearchFilter = () =>{
        tableInterface.requestParams.search = '';
        tableInterface.refreshData();
    }

    const debounceRefreshData = debounce((val)=>{
        tableInterface.requestParams.search = val;
        tableInterface.refreshData();
    }, DEBOUNCE_TIMEOUT);

    const handleSearchSGood =(ev: any) => {
        const { value } = ev.target;
        if(value && value.length>3) {
            debounceRefreshData(value);
        } else {
            if(value=='') {
                resetSearchFilter()
            }
        }
    }


    Modal.confirm({
        centered: true,
        title: 'Выбор ТМЦ',
        width: "70%",
        content: (
            <div style={{ height: "580px" }}>
                <SplitterLayout primaryIndex={1} secondaryInitialSize={250}>
                    <div>
                        <Space style={{ padding: 8 }}>
                            <Button
                                icon={<ArrowLeftOutlined />}
                                className={classes.backButton}
                                onClick={handleHistoryBack}
                            />
                            <Button
                                icon={<ArrowRightOutlined />}
                                className={classes.backButton}
                                onClick={handleHistoryNext}
                            />
                            <Input.Search allowClear onChange={handleSearchTree}/>
                        </Space>
                        <DataTree.SGood
                            interface={treeInterface}
                            onChange={handleSelect}
                            height={520}
                            style={{ paddingTop: 8 }} />
                    </div>
                    <div>
                        <Space style={{ padding: 8,width: "100%",justifyContent: "flex-end" }}>
                            <Input.Search allowClear onChange={handleSearchSGood}/>
                        </Space>
                        <DataTable
                            className="mod-main-table"
                            selectType="radio"
                            editable={false}
                            uri={{
                                forSelect: "refbooks/sgood/sgood/getlist"
                            }}
                            autoRefresh={false}
                            columns={[
                                {
                                    title: 'Наименование',
                                    dataIndex: 'sgoodName',
                                    sorter: true,
                                    ellipsis: true,
                                    defaultSortOrder: 'ascend',
                                    width: "300px"
                                },
                                {
                                    title: 'Код',
                                    dataIndex: 'sgoodCode',
                                    sorter: true,
                                    ellipsis: true,
                                },
                                {
                                    title: 'Примечание',
                                    dataIndex: 'sgoodDescription',
                                    sorter: true,
                                    ellipsis: true,
                                }
                            ]}
                            interface={tableInterface}
                            idName={"sgoodId"}
                        />

                    </div>
                </SplitterLayout>
            </div>
        ),
        onOk: (closeFunc) => checkInput(closeFunc),
        onCancel: () => finalyCB(false),
        okText: "Выбрать"
    });

}
