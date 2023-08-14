import { Affix } from "antd"
import withStyles, {WithStylesProps} from "react-jss";


// JSS. Стили компонента
const styles = {
    'mod-affix': {
        marginBottom: '8px'
    }
}

interface ComponentProps extends WithStylesProps<typeof styles> {
    children: React.ReactNode,
}


const AppAffixImpl:React.FC<ComponentProps> = ({children, classes})=>{
    return <Affix offsetTop={46} className={`mod-affix ${classes['mod-affix']}`}>
        {children}
    </Affix>
}

export const AppAffix = withStyles(styles)(AppAffixImpl)

