import { Workbook } from 'exceljs';
const FileSaver = require('file-saver');

export const downloadDataAs = (fname: string, data: string) => {
    var link = document.createElement("a");
    link.href = data;
    link.download = fname;
    link.click();
}

const replacer = (key: string, value: any) => value === null ? '' : value;
const getColumnTitle = (c: any)=>!c.children?c.title:c.children.map((c1: any)=>getColumnTitle(c1));
const getColumnData = (c: any, r: any)=>!c.children?c.exportFunction?c.exportFunction(r):JSON.stringify(r[c.dataIndex],replacer):c.children.map((c1: any)=>getColumnData(c1,r));
const getColumnRawData = (c: any, r: any)=>!c.children?c.exportFunction?c.exportFunction(r):r[c.dataIndex]:c.children.map((c1: any)=>getColumnRawData(c1,r));

export const exportJsonToCVS = (json: any, columns: object[], fname: string) => {
    // отсекаем сервисные поля
    columns = columns.filter((c: any) => !c.serv);
    // формируем заголовок
    const header = columns
        .flatMap((c: any) => getColumnTitle(c));

    const csv = [
        header.join(','), // header row first
        ...json.map((r: any) => columns.flatMap((c: any) => getColumnData(c,r)).join(','))
    ].join('\r\n')
    downloadDataAs(fname, encodeURI("data:text/csv;charset=utf-8," + csv));
}

export const exportJsonToExcel = (json: any, columns: object[], fname: string) => {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("Export Data");
    // отсекаем сервисные поля
    columns = columns.filter((c: any) => !c.serv);
    // формируем заголовок
    const header = columns
        .flatMap(c => getColumnTitle(c));
    worksheet.addRow(header);
    // цикл по записям
    json.map((r: any) => worksheet.addRow(columns.flatMap(c => getColumnRawData(c,r))))
    workbook.xlsx.writeBuffer().then((data) => {
        let blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        FileSaver.saveAs(blob, fname);
    });
}
