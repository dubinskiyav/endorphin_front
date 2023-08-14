import React,{ Suspense } from 'react';
import { withRouter } from "react-router";
import ModernApp from './App2'
import ModuleHeader from "./lib/ModuleHeader";
import { AppAffix } from "./lib/AppAffix";
import {ModelViewer} from "./lib/ModelViewer";

const MermaidChart = React.lazy(() => import('./lib/MermaidChart'));

const MOD_TITLE = "Тестовая страница";

const  Error = (props,) => {
    return (
        <ModernApp>
            <AppAffix>
                <div>
                    <ModuleHeader title={MOD_TITLE} search={false}/>
                </div>
            </AppAffix>
            <Suspense fallback={<div>Загрузка...</div>}>

             </Suspense>

        </ModernApp>
    )
}
export default withRouter(Error);


