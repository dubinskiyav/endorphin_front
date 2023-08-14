import React from 'react';

import DataLookup from "./DataLookup";

const styleWorkerRow = {
    Position: "absolute",
    right: "8px",
    display: "inline-block"
}

type WorkerItem = {
    workerId: number,
    fio: string,
    workerTabnumber: string | number
}

export const WorkerLookup = React.forwardRef<any, any>((props, ref) => {

    const renderItem = (item: WorkerItem) => {
        console.log(item)
        return {
            id: item.workerId,
            key: item.workerId,
            value: item.fio,
            label:
                <div>
                    <div>{item.fio}<span style={styleWorkerRow}>{item.workerTabnumber}</span></div>
                </div>
        }
    }

    return <DataLookup ref={ref} uri={"refbooks/person/worker/find"}
        renderItem={renderItem}
        {...props} />
});

WorkerLookup.displayName = 'DataLookup.Worker';
