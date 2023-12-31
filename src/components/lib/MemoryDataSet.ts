export const StatusRecord = {
    ORIGINAL: 0,
    INSERTED: 1,
    UPDATED: 2,
    DELETED: 3
}

export const MemoryDataSet = {
    data: [] as any[],
    delta: [] as any[],
    insert: function (newrec: any)  {
        this.data.push(this.newRecord(newrec));
        const deltarec = this.newRecord(newrec);
        deltarec.status = StatusRecord.INSERTED;
        this.delta.push(deltarec);
    },
    update: function (updrec: any, idName: string | number) {
        const idx = this.data.findIndex(r => r.record[idName] == updrec[idName]);
        if (idx < 0) return;
        const oldData = this.data[idx].record;
        this.data[idx].record = updrec;
        const deltarec = this.newRecord(updrec, oldData);
        deltarec.status = StatusRecord.UPDATED;
        this.delta.push(deltarec);
    },
    delete: function (delrec: any, idName: string | number) {
        const idx = this.data.findIndex(r => r.record[idName] == delrec[idName]);
        if (idx < 0) return;
        this.data.splice(idx, 1);
        const deltarec = this.newRecord(delrec);
        deltarec.status = StatusRecord.DELETED;
        this.delta.push(deltarec);
    },
    newRecord: (data: any, oldData?: any) => {
        return {
            timeLabel: new Date().getTime(),
            status: StatusRecord.ORIGINAL,
            record: data,
            oldRecord: oldData
        };
    },
    setOriginalData: function (data: any[], delta: any[]) {
        this.data = [];
        this.delta = [];
        data.forEach(value => {
            this.data.push(this.newRecord(value));
        });
        delta.forEach(value => {
            this.delta.push(value);
        });
    },
}
