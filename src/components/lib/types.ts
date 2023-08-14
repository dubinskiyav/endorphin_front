

export type objectWithAnyFields = {[x: string | number]: any}


// DataTableTypes


export type QfiltersItemType = {
    key: string,
    title: string,
    value: any,
    oper: string,
    operTag: string
}

// PrintDialogTypes

export type paramDescType = {
    initValue?: any
    label: string
    name: string
    options: objectWithAnyFields,
    subType?: string | number,
    type: string | undefined
}
