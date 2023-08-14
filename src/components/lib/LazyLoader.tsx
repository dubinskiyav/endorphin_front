import * as React from 'react'
import withStyles, { WithStylesProps } from 'react-jss'

import {Skeleton } from 'antd';

// JSS. Стили компонента
const styles = {
}

const _cacheLoadedComponent = new Map<string, JSX.Element>();

// спецификация пропсов
interface ComponentProps extends WithStylesProps<typeof styles> {
    key:string,
    rows?:number,
    promise:() => Promise<JSX.Element>,
    style?:object
}    

const LazyLoaderImpl:React.FC<ComponentProps> = ({classes,key, rows,promise, ...remainder}) => {
    const [loading, setLoading] = React.useState(true);
    const [inner,setInner] = React.useState<JSX.Element>();

    React.useEffect(()=>{
        const comp = _cacheLoadedComponent.get(key)
        if(comp) {
            setInner(comp);
            setLoading(false);
            return;
        }

        promise().then((comp:JSX.Element)=>{
            _cacheLoadedComponent.set(key,comp);
            setInner(comp);
            setLoading(false);
        })
    },[key, promise])


    return <Skeleton loading={loading} 
                active={loading} 
                title={false} paragraph={{rows:rows}}
                {...remainder}
                >    
           {inner}     
    </Skeleton>            
}   

export default withStyles(styles)(LazyLoaderImpl)
