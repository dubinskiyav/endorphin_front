import React, {CSSProperties, FC, useState} from 'react';
import { Transfer } from 'antd';
import { notification } from 'antd';
import { MSG_NO_RECORD_FORGETONE } from './Const';
import requestToAPI from "./Request";

interface DataTransferProps {
    uri: string,
    params: any,
    ready: boolean,
    targetKeys?: any,
    onChange?: (value: any) => void,
    titles?: string[],
    onRender: any,
    disabled?: boolean,
    listStyle?: CSSProperties | undefined,
}
const DataTransfer: FC<DataTransferProps> = ({ready= false, ...props}) => {
    const [data, setData] = React.useState<any[] | null>(null);
    const [targetKeys, setTargetKeys] = useState(props.targetKeys);
    const [selectedKeys, setSelectedKeys] = useState<any[]>([]);
    const [contextParams] = React.useState<any>({});

    const onChange = (nextTargetKeys: any, direction: any, moveKeys: any) => {
        console.log('targetKeys:', nextTargetKeys);
        console.log('direction:', direction);
        console.log('moveKeys:', moveKeys);
        setTargetKeys(nextTargetKeys);
        if (props.onChange) props.onChange(nextTargetKeys);
    };

    const onSelectChange = (sourceSelectedKeys: any, targetSelectedKeys: any) => {
        console.log('sourceSelectedKeys:', sourceSelectedKeys);
        console.log('targetSelectedKeys:', targetSelectedKeys);
        setSelectedKeys([...sourceSelectedKeys, ...targetSelectedKeys]);
    };

    const onScroll = (direction: any, e: any) => {
        console.log('direction:', direction);
        console.log('target:', e.target);
    };

    //Загрузка
    const load = React.useCallback(() => {
        // setLoading(true);
        if (props.uri) {
            console.log("DataTransfer load list");
            requestToAPI.post(props.uri, props.params)
                .then((response: any) => {
                    // если компонент размонтирован не надо устанавливать данные
                    if (!contextParams.mountFlag) return;
                    // setLoading(false);
                    response = response.result;
                    setData(response.map((val: any) => {
                        val.key = val[Object.keys(val)[0]];
                        return val
                    }));
                })
                .catch(error => {
                    // если компонент размонтирован не надо устанавливать данные
                    if (!contextParams.mountFlag) return;
                    // setLoading(false);
                    notification.error({
                        message: MSG_NO_RECORD_FORGETONE,
                        description: error.message,
                    })
                    // props.afterCancel();
                    setData([]);
                })
        } else {
            // setLoading(false);
            setData([]);
        }
    }, [props, contextParams.mountFlag])

    React.useEffect(() => {
        contextParams.mountFlag = true;
        if (!data) {
            setData([]);
            if (ready) {
                load();
            }
        }
        // размонтирования компонента сбросит флаг
        return (): any => contextParams.mountFlag = false;
    }, [data, contextParams, load, ready]);

    return (
        <Transfer
            dataSource={data ?? []}
            titles={props.titles ?? ["Доступно", "Выбрано"]}
            targetKeys={targetKeys}
            selectedKeys={selectedKeys}
            onChange={onChange}
            onSelectChange={onSelectChange}
            onScroll={onScroll}
            render={props.onRender}
            disabled={props.disabled ?? false}
            showSearch
            listStyle={{
                width: "calc(50% - 20px)",
                height: "calc(100vh - 320px)",
                ...props.listStyle
            }}
            filterOption={(inputValue, option) => (props.onRender(option) ?? "").toLowerCase().indexOf(inputValue.toLowerCase()) !== -1}

        />
    );
};

export default DataTransfer;
