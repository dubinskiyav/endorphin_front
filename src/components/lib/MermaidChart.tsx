import * as React from 'react'
import mermaid from 'mermaid'
import withStyles, { WithStylesProps } from 'react-jss'

mermaid.initialize({
    startOnLoad: true,
    flowchart:{        
    }
});


  
// JSS. Стили компонента
const styles = {
    root:{
        textAlign: 'center',
        "& svg":{
            maxHeight:(props:any)=>props.height
        }
    }    
}

// спецификация пропсов
interface ComponentProps extends WithStylesProps<typeof styles> {
    chart:String,
    height?:String
}    

const MermaidChartImpl:React.FC<ComponentProps> = ({chart,classes,height}) => {
    let rootnode:any = null;

    React.useEffect(()=>{
        rootnode.removeAttribute("data-processed");
        mermaid.contentLoaded();
    },[chart,rootnode])

    return <div ref={(e) => (rootnode = e)} className={'mermaid '+classes.root}>{chart}</div>    
}

export default withStyles(styles)(MermaidChartImpl)
