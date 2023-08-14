import ModernApp from './App2'
import ModuleHeader from "./lib/ModuleHeader";
import { AppAffix } from "./lib/AppAffix";

const MOD_TITLE = "Произошла ошибка";

const Error = (props) => {
    return (
        <ModernApp>
            <AppAffix>
                <ModuleHeader title={MOD_TITLE} search={false}/>
                <p className="error">{props.text}</p>
            </AppAffix>
        </ModernApp>
    )
}
export default Error;
