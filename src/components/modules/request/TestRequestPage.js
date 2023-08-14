import { Form } from 'antd';
import { withRouter } from "react-router";

import EditPage from "../../lib/EditPage"
import ModernApp from '../../App2'
import TestRequestForm from "./TestRequestForm";
import { CONTOUR_DOCUMENTS, MODULE_REQUEST } from "../../lib/ModuleConst"
import { buildURL} from "../../lib/Utils";

const CONTOUR = CONTOUR_DOCUMENTS;
const MODULE = MODULE_REQUEST;

const URI_FOR_GET_ONE = buildURL(CONTOUR, MODULE, "testrequest") + "/get";
const URI_FOR_SAVE = buildURL(CONTOUR, MODULE, "testrequest") + "/save";

// Конвертация значений, приходящих и уходящих через API
const CONVERTORS = {
    date: ["documentRealDate"]
}

const TestRequestPage=(props)=>{
    const [form] = Form.useForm();
    const idValue = props.match.params.id;
    const editorContext = {
        id:idValue,
        uriForGetOne:URI_FOR_GET_ONE,
        uriForSave:URI_FOR_SAVE
    }
    

    return <ModernApp>
            <EditPage idName="testRequestId" editorContext={editorContext} form={form} convertors={CONVERTORS}>
                  <TestRequestForm initialValues={{}} />
            </EditPage>
    </ModernApp>        
}

export default withRouter(TestRequestPage);