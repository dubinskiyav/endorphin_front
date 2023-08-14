import ReactDOM from 'react-dom';

import Edizm from './components/modules/edizm/Edizm';
import Error from "./components/Error";
import Test from "./components/Test";
import ProgUser from "./components/modules/admin/ProgUser";
import AccessRole from "./components/modules/admin/AccessRole";
import ControlObject from "./components/modules/admin/ControlObject";
import ApplicationRole from "./components/modules/admin/ApplicationRole";
import CapResourceRole from "./components/modules/admin/CapResourceRole";
import Audit from "./components/modules/audit/Audit";
import SenderLog from "./components/modules/senderlog/SenderLog";
import Document from "./components/modules/resource/Document";
import CapResource from "./components/modules/resource/CapResource";
import RecoveryPassword from "./components/lib/RecoveryPassword";
import TestRequest from "./components/modules/request/TestRequest";
import TestRequestWithEditPage from "./components/modules/request/TestRequestWithEditPage";
import TestRequestPage from "./components/modules/request/TestRequestPage";
import Worker from './components/modules/worker/Worker'
import CapClassLabel from './components/modules/capclass/CapClassLabel';

import { MSG_PAGENOTFOUND, DEFAULT_DATE_FORMAT } from "./components/lib/Const";

import './resources/css/theme.less';
import './resources/css/index.css';

import { ConfigProvider } from 'antd';
import ruRU from 'antd/lib/locale/ru_RU';
import moment from 'moment';
import 'moment/locale/ru';

import { Route } from 'react-router';
import { BrowserRouter, Switch } from "react-router-dom";
import CapClass from './components/modules/capclass/CapClass';
import Session from './components/modules/audit/Session';
import { Home } from './components/modules/home/Home';


document.documentElement.lang = 'ru';
moment.locale('ru');
moment().format(DEFAULT_DATE_FORMAT);

const validateMessages = {
    required: "Необходимо определить '${label}'",// eslint-disable-line
    string: {
        max: "Длина '${label}' не может быть больше ${max}"// eslint-disable-line
    }

};
console.log("%cApplication version %c "+process.env.REACT_APP_VERSION+" ",'color: blue','background: #222; color: #bada55');
console.log("environment=", process.env);

ReactDOM.render(
    <ConfigProvider locale={ruRU} form={{ validateMessages }}>
        <BrowserRouter>
            <Switch>
                <Route exact path='/'><Home /></Route>
                <Route exact path='/edizm'><Edizm /></Route>
                {/* Контур Администрирование */}
                <Route exact path='/proguser'><ProgUser /></Route>
                <Route exact path='/accessrole'><AccessRole /></Route>
                <Route exact path='/controlobject'><ControlObject /></Route>
                <Route exact path='/applicationrole'><ApplicationRole /></Route>
                <Route exact path='/capresourcerole'><CapResourceRole /></Route>
                {/* Аудит */}
                <Route exact path='/audit'><Audit /></Route>
                <Route exact path='/senderlog'><SenderLog /></Route>
                <Route exact path='/session'><Session /></Route>
                {/* Конфигуратор */}
                <Route exact path='/document'><Document /></Route>
                <Route path='/capresource/:resourceTypeId'><CapResource /></Route>
                {/* Тестовый контур */}
                <Route exact path='/testrequest'><TestRequest /></Route>
                <Route exact path='/testrequest1'><TestRequestWithEditPage /></Route>
                
                <Route exact path='/testrequest-form-on-page/:id'><TestRequestPage /></Route>

                {/* Персоны */}
                <Route exact path='/person'><Worker /></Route>

                <Route path='/test'><Test /></Route>
                <Route path='/recovery/:key'><RecoveryPassword /></Route>
                <Route path='/capclass/:capClassTypeId/:contourName/:moduleName'><CapClass /></Route>
                <Route path='/capclasslabel/:capClassTypeId/:contourName/:moduleName'><CapClassLabel /></Route>
                <Route><Error text={MSG_PAGENOTFOUND} helpId="/help/pagenotfound" /></Route>


            </Switch>
        </BrowserRouter>
    </ConfigProvider>
    , document.getElementById('root')
);