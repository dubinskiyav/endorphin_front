import React, {FC} from 'react';
import { Modal, Menu } from 'antd';
import { SortAscendingOutlined,SortDescendingOutlined, StopOutlined, FilterOutlined } from '@ant-design/icons';
import {nextSortDirection} from '../DataTable';
import {objectWithAnyFields} from "../types";


interface ColumnDialogMobileProps {
    interface?: objectWithAnyFields,
    onSortNext: (value: any) => void,
    onFilter: (fvalue: any, svalue: string, tvalue: any) => void
}

const ColumnDialogMobile: FC<ColumnDialogMobileProps> = (props) => {
    const [visible, setVisible] = React.useState<boolean>(false);
    const [column, setColumn] = React.useState<any>(false);
    const [value, setValue] = React.useState<any>();

    if(props.interface) {
        props.interface.showModal = (col: any, value: any) => {
            setColumn(col);
            setValue(value)
            setVisible(true);
        }
        props.interface.close = () => {
            setVisible(false);
        }
    }

    const handleCancel = () => {
      setVisible(false);
    };

    const nextOrderDir = nextSortDirection(column.sortOrder);
    let sortMenuItemTitle = "Сбросить сортировку";
    let sortMenuItemIcon = <StopOutlined />;
    switch(nextOrderDir) {
        case "ascend":{
            sortMenuItemTitle = "Сортировать по возрастанию";
            sortMenuItemIcon = <SortAscendingOutlined />;
            break;
        }
        case "descend":{
            sortMenuItemTitle = "Сортировать по убыванию";
            sortMenuItemIcon = <SortDescendingOutlined />;
            break;
        }
        default:
    }


    return (
        <Modal
          title={`Колонка ${column.title}`}
          wrapClassName={"__dialog__column__menu"}
          centered={true}
          visible={visible}
          closable={true}
          footer={null}
          onCancel={handleCancel}
        >
          <Menu>
                { (column.sorter)?
                  <Menu.Item key={"sort"} onClick={()=>props.onSortNext(column)} icon={sortMenuItemIcon}>{sortMenuItemTitle}</Menu.Item>
                  :""
                }
                <Menu.Item key={"f-eq"} onClick={()=>props.onFilter(column,"eq",value)} icon={<FilterOutlined />}>Фильтр - Равно</Menu.Item>
                {/* в gu пока не реализовано
                <Menu.Item key={"f-neq"} onClick={()=>props.onFilter(column,"neq",value)} icon={<FilterOutlined />}>Фильтр - Не равно</Menu.Item>
                */}
                <Menu.Item key={"f-like"} onClick={()=>props.onFilter(column,"like",value)} icon={<FilterOutlined />}>Фильтр - Содержит</Menu.Item>
          </Menu>
        </Modal>
    );
};


export default ColumnDialogMobile;
