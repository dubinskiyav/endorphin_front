import {objectWithAnyFields} from "./types";
import {transliterate} from "transliteration";


interface Props {
    modelTableViews: any[]
    modelPageViews: any[]
}

export const parseBase64ToXml = (base64String: string) => {
    // Декодирование строки Base64 в бинарные данные
    const binaryString = atob(base64String);

    const parser = new DOMParser();
    // Парсинг бинарных данных в XML-документ
    const xmlDocument = parser.parseFromString(binaryString, 'text/xml');
    return xmlDocument;
}
const parseTablesXml = (tables: any, idTable: any) => {
    let outputTables: any = []

    for (let i = 0; i < tables.length; i++) {
        let output: objectWithAnyFields = {}
        const table = tables[i]
        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(table, "text/xml")
        const tableId = xmlDoc.getElementsByTagName("Table")[0].getAttribute("id")
        if (idTable.includes(tableId)) {
            const tableName = xmlDoc.getElementsByTagName("Table")[0].getAttribute("name")

            output['tableId'] = tableId
            output['tableName'] = tableName

            const fields = xmlDoc.getElementsByTagName("Field")
            output['fields'] = []
            output['oneToOne'] = false

            // связи fk
            let massFk = []
            let massLink = []
            const references = xmlDoc.getElementsByTagName("Reference")
            for (let j = 0; j < references.length; j++) {
                const reference = references[j]
                const source = reference.getElementsByTagName("Source")[0]
                const fieldRef = source.getElementsByTagName("FieldRef")[0]
                const fieldRefId = fieldRef.getAttribute("fieldId")
                massFk.push(fieldRefId)

                const id = reference.getAttribute("id")
                const name = reference.getAttribute("name")
                const displayName = reference.getAttribute("displayName")
                const refTableId = reference.getAttribute("refTableId")
                massLink.push({id, name, displayName, refTableId})

            }

            // связи ak
            let massAk = []
            const naturalKeyList = xmlDoc.getElementsByTagName('Fields')
            for (let i = 0; i < naturalKeyList.length; i++) {
                const naturalKey = naturalKeyList[i]
                const fieldRef = naturalKey.getElementsByTagName('FieldRef')[0]
                const fieldRefId = fieldRef.getAttribute('fieldId')
                massAk.push(fieldRefId)
            }


            for (let j = 0; j < fields.length; j++) {
                const obj: objectWithAnyFields = {}
                const field = fields[j]
                obj['fieldName'] = field.getAttribute("name")
                obj['fieldType'] = field.getAttribute("type")
                obj['displayname'] = field.getAttribute("displayname")
                let primary = field.getAttribute("primary")
                obj['primary'] = primary
                obj['notNull'] = field.getAttribute("notnull")

                const fieldId = field.getAttribute("id")
                obj['fk'] = ''
                if (massFk.includes(fieldId)) {
                    obj['fk'] = 'fk'
                    if (primary === "true") {
                        output['oneToOne'] = true
                    }

                }

                obj['ak'] = ''
                if (massAk.includes(fieldId)) {
                    obj['ak'] = 'ak'
                }

                output['fields'].push(obj)
            }
            output['links'] = massLink
            outputTables.push(output)
        }
    }
    return outputTables

}

function createStringInfo(ak: boolean, nn: boolean) {
    let str = null
    if (ak) {
        str = "AK"
        if (nn) {
            str += ", NN"
        }
    } else if (nn) {
        str = "NN"
    }
    if (str !== null) {
        str = '"' + str + '"'
    }
    if (str) {
        return ' ' + str
    }
    return ''

}
export const parseModel = (modelPageViews: any, modelTableViews: any) => {
    if (!modelPageViews || !modelPageViews.length) {
        return ""
    }

    let resultData = []
    for (let k = 0; k < modelPageViews.length; k++) {
        let parser = new DOMParser()
        let xmlDoc = parser.parseFromString(modelPageViews[k], "text/xml")
        let shapes = xmlDoc.getElementsByTagName("Shapes")[0]
        let tables = shapes.getElementsByTagName("Table")
        let links = shapes.getElementsByTagName("Link")
        let tableMap: objectWithAnyFields = {}
        let tablesName = []
        let idTables = []
        for (let i = 0; i < tables.length; i++) {
            let table = tables[i];
            let id = table.getAttribute("tableId")
            if (id) {
                idTables.push(id)
            }
        }


        let parseTables: any = parseTablesXml(modelTableViews, idTables)

        // объекты таблиц
        for (let i = 0; i < tables.length; i++) {
            let table = tables[i];
            let id = table.getAttribute("id") ? table.getAttribute("id") : Math.floor(Math.random() * 10000)
            let tableId = table.getAttribute("tableId")
            let tableNumid = table.getAttribute("tableNumid")
            let Primary = table.getAttribute("Primary") === "true"
            let currTable = parseTables.find((table: any) => table.tableId === tableId)
            if (currTable) {
                tablesName.push({ pageName: shapes.getAttribute("name"), tableName: currTable['tableName'] })
            }

            tableMap[id as any] = {
                id,
                tableId,
                tableNumid,
                Primary,
                links: [],
                table: currTable ? currTable : null
            };
        }

        // объекты связей
        for (let i = 0; i < links.length; i++) {
            let link = links[i];
            let srcId = link.getAttribute("srcId")
            let dstId = link.getAttribute("dstId")
            let fkId = link.getAttribute("fkId")

            tableMap[srcId as any].links.push({
                dstId,
                fkId
            });
        }
        // mermaid ER-диаграмма
        let mermaidDiagram = "erDiagram\n"
        for (let id in tableMap) {
            let table = tableMap[id]
            if (table['table']) {
                mermaidDiagram += "  " + table['table']?.tableName + " {" + '\n  '
                if (table['table']?.fields) {
                    mermaidDiagram += table['table']?.fields.map((field: any) => {
                        return `${field.fieldType}`
                            + ` ${field.displayname.replace(/\s+/g, ' ').split(' ').map((word: string) => transliterate(word)).join('_')}`
                            + `${field.primary === "true" ? ' PK' : ''}`
                            + `${field.fk !== "" ? field.primary === "true" ? ', FK' : ' FK' : ''}`
                            + createStringInfo(field.ak !== "", field.notNull == "true")
                    }).join('\n  ')
                }
                mermaidDiagram += '\n' + " }";
            }


            for (let i = 0; i < table.links.length; i++) {
                mermaidDiagram += '\n'
                let link = table.links[i]
                let dstTable = tableMap[link.dstId]
                let references = table['table']?.links
                let ref = references?.filter((r: any) => r.refTableId === dstTable['table']?.tableId)[0]
                if (table['table']?.tableName && dstTable['table']?.tableName) {
                    mermaidDiagram += '  ' + table['table']?.tableName
                        + `${table['table']?.oneToOne ? ' || -- || ' : ' }o -- o{  '}`
                        + dstTable['table']?.tableName + ' : ' + `${ref ? ref.displayName : 'link'}`
                }

            }
            mermaidDiagram += "\n"
        }
        let obj = {
            'id': k,
            'name': shapes.getAttribute("name"),
            'mermaidDiagram': mermaidDiagram,
            'tables': tablesName
        }
        resultData.push(obj)
    }
    return resultData


}




