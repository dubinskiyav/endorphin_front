import React from 'react';
import { Form } from 'antd';
import DataTransfer from "../../lib/DataTransfer";
import { buildURL } from "../../lib/Utils";
import { CONTOUR_ADMIN, MODULE_CREDENTIAL } from "../../lib/ModuleConst";

export const ManageAccessRoleForm = (props) => {

    const readyForm = Object.keys(props.initialValues).length > 0;
    console.log("readyForm=", readyForm);

    return <Form
        form={props.form}
        layout="horizontal"
        name="formManageAccessRole"
        onFieldsChange={props.onFieldsChange}
        initialValues={props.initialValues}>
        <Form.Item
            name="accessRoleIds"
            valuePropName="targetKeys"
        >
            <DataTransfer
                titles={["Роли","Назначенные пользователю"]}
                uri={buildURL(CONTOUR_ADMIN, MODULE_CREDENTIAL, "AccessRole") + "/getlist"}
                params={{
                    "pagination": {
                        "current": 1,
                        "pageSize": -1
                    },
                    "sort": [
                        {
                            "field": "accessRoleName",
                            "order": "ascend"
                        }
                    ],
                    "filters":{
                        "onlyVisible":1
                    }
                }}
                onRender={item => item.accessRoleName}
                ready={readyForm}
            />
        </Form.Item>
    </Form>
}