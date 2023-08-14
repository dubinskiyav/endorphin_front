import React, {Suspense, useEffect, useLayoutEffect, useState} from "react";
import {Form, Input, Select, Spin, Tabs} from "antd";
import {FORM_ITEMS_LAYOUT} from "../../lib/Const";
import {parseBase64ToXml, parseModel} from "../../lib/ModelViewer";
import ModuleHeader from "../../lib/ModuleHeader";

const {Search} = Input;
const {TabPane} = Tabs;
const {Option} = Select;

let testPages = [
    `<Shapes name="Справочники" id="{F9183944-6003-4974-AAC8-69926780F046}">
  <Table x="-344" y="-555" tableId="{B96194F5-1263-42A4-843B-E5267C9C678C}" id="{1CBC669E-A6DE-4761-8C6C-E0D1B75A0047}" tableNumid="3033" Primary="false"/>
  <Table x="-378" y="-372" tableId="{0845BB16-D7BA-48E4-BFAF-7EB1A8548A30}" id="{3286CEC3-E48F-46C8-BEF7-C2F74B7A8D51}" tableNumid="18808" Primary="true"/>
  <Table x="112" y="-507" tableId="{047B3FA8-4A97-4191-9E9D-F674877C699A}" id="{79C75C57-D424-4766-830A-F9BE2F3A36D0}" tableNumid="3492" Primary="false"/>
  <Table x="-488" y="-193" tableId="{4BBC4D56-D12C-4EF6-93AB-46B1E1F916B5}" id="{262BBCB3-EE06-437A-94A5-D1F4B9FE0D89}" tableNumid="18797" Primary="false"/>
  <Table x="56" y="-234" tableId="{B90F6C2E-B830-4098-8C8E-4CB4FF94ECE3}" id="{173BF8B7-288C-422F-A4B4-9983B93D376D}" tableNumid="3132" Primary="false"/>
  <Table x="58" y="-82" tableId="{FA099463-5862-44A7-B9CF-AB34FE463973}" id="{8779A235-0F41-4619-85BC-3D1A31BB2459}" tableNumid="3131" Primary="false"/>
  <Table x="-440" y="70" tableId="{300BD74D-0BBC-41BC-8545-F33396434034}" id="{624E3F04-E2EA-4475-A35C-68A7A4A73C20}" tableNumid="3025" Primary="false"/>
  <Table x="473" y="-301" tableId="{40D6258C-5C2E-484C-B4E2-2BEB38730BF6}" id="{97F49B52-11D7-420F-B1BD-E2C84B4E71A9}" tableNumid="18809" Primary="true"/>
  <Table x="728" y="-146" tableId="{68FFC256-83D9-496D-9F02-090D3CD621D9}" id="{24300A47-7E64-4EBE-BFBB-B8654024079C}" tableNumid="18810" Primary="true"/>
  <Link srcId="{3286CEC3-E48F-46C8-BEF7-C2F74B7A8D51}" dstId="{1CBC669E-A6DE-4761-8C6C-E0D1B75A0047}" fkId="{0A863CCB-9B6C-45CD-BAD2-6CB9BF432195}" rectangled="true">
    <Point x="-359" y="-418"/>
    <Point x="-359" y="-474"/>
  </Link>
  <Link srcId="{97F49B52-11D7-420F-B1BD-E2C84B4E71A9}" dstId="{79C75C57-D424-4766-830A-F9BE2F3A36D0}" fkId="{B871A908-B3DF-44E7-84E5-1490A052EE0F}" rectangled="true">
    <Point x="473" y="-354"/>
    <Point x="473" y="-396"/>
    <Point x="247" y="-396"/>
  </Link>
  <Link srcId="{24300A47-7E64-4EBE-BFBB-B8654024079C}" dstId="{97F49B52-11D7-420F-B1BD-E2C84B4E71A9}" fkId="{ECC62CC7-2BE1-430A-A5DC-283CC8BD46FF}" rectangled="true">
    <Point x="598" y="-138"/>
    <Point x="529" y="-138"/>
    <Point x="529" y="-248"/>
  </Link>
  <Text x="-437" y="-273" cx="293" cy="23" text="контроллер адмистративно-территориальной единицы" frameType="0">
    <Font Font_Name="Tahoma" Color="-16777208" CharSet="1" Size="8" Style="0"/>
  </Text>
  <Text x="295" y="-187" cx="104" cy="36" text="8001 - Типы работ&#xA;8002 - Виды работ" frameType="1">
    <Font Font_Name="Tahoma" Color="-16777208" CharSet="1" Size="8" Style="0"/>
  </Text>
  <Text x="370" y="-111" cx="267" cy="88" text="Справочник типов работ&#xA;&#xA;8001001   СМР   Работы по капитальному ремонту&#xA;8001002   СК    Строй контроль&#xA;8001003   ПИР   Проектно-изыскательские работы&#xA;8001004   ГЭЭ   Экспертиза смет" frameType="1">
    <Font Font_Name="Tahoma" Color="-16777208" CharSet="1" Size="8" Style="0"/>
  </Text>
  <Text x="567" y="84" cx="666" cy="260" text="8002001    01    Ремонт фундамента многоквартирного дома&#xA;8002002    02    Ремонт технических этажей - подвальных помещений, помещений цокольных этажей&#xA;          и технических подполий,относящихся к общему имуществу в многоквартирных домах&#xA;8002003    03    Утепление и (или) ремонт фасада&#xA;8002004    04    Ремонт крыши, чердаков&#xA;8002005    05    Ремонт внутридомовых инженерных систем электроснабжения&#xA;8002006    06    Ремонт внутридомовых инженерных систем теплоснабжения &#xA;8002007    07    Ремонт внутридомовых инженерных систем газоснабжения&#xA;8002008    08    Ремонт внутридомовых инженерных систем водоснабжения &#xA;8002009    09    Ремонт внутридомовых инженерных систем водоотведения &#xA;8002010    10    Ремонт внутридомовых инженерных систем вентиляции&#xA;8002011    11    Мероприятия по приспособлению общего имущества в многоквартирном доме, в котором проживает инвалид&#xA;8002012    12    Разработка проектной документации по капитальному ремонту общего имущества в многоквартирном доме&#xA;8002013    13    Проведение проверки на достоверность определения сметной стоимости капитального ремонта&#xA;8002014    14    Услуги по строительному контролю&#xA;8002015    15    Установка или замена коллективных (общедомовых) приборов учета электроснабжения&#xA;8002016    16    Установка или замена коллективных (общедомовых) приборов учета теплоснабжения&#xA;8002017    17    Установка или замена коллективных (общедомовых) приборов учета газоснабжения&#xA;8002018    18    Установка или замена коллективных (общедомовых) приборов учета водоснабжения&#xA;" frameType="1">
    <Font Font_Name="Tahoma" Color="-16777208" CharSet="1" Size="8" Style="0"/>
  </Text>
  <Text x="583" y="-610" cx="447" cy="62" text="Справочник административно-территориальных единиц &#xA;в стандартной таблице subject&#xA;Создать папку «Административно-территориальные единицы», где разместить ОАУ&#xA;rf_dept - родная таблица&#xA;" frameType="1">
    <Font Font_Name="Tahoma" Color="-16777208" CharSet="1" Size="8" Style="0"/>
  </Text>
  <Text x="787" y="-361" cx="161" cy="192" text=" 1   Красноселькупский район&#xA; 2   Надымский район&#xA; 3   Приуральский район&#xA; 4   Пуровский район&#xA; 5   Тазовский район&#xA; 6   Шурышкарский район&#xA; 7   Ямальский район&#xA; 8   Губкинский город&#xA; 9   Муравленко город&#xA;10   Надым город&#xA;11   Новый Уренгой город&#xA;12   Ноябрьск город&#xA;13   Лабытнанги город&#xA;14   Салехард город" frameType="1">
    <Font Font_Name="Tahoma" Color="-16777208" CharSet="1" Size="8" Style="0"/>
  </Text>
</Shapes>`
]
let testTables = [
    ` <Table id="{B96194F5-1263-42A4-843B-E5267C9C678C}" name="proguser" tableNumid="3033" displayName="Пользователь" baseTable="" isView="false" version="25">
  <Description></Description>
  <FieldList>
    <Field id="{AFF99D4C-96D8-4A1C-892C-70F42F2E0F1C}" name="proguser_id" displayname="Пользователь ИД" type="INTEGER" default="" primary="true"/>
    <Field id="{7816783E-B5B4-4AC5-B37B-C8A7FC2AAC5E}" name="progusergroup_id" displayname="Группа EVERYONE" type="INTEGER" default="" primary="false" notnull="true"/>
    <Field id="{7DE7D82C-A345-4847-B16D-35BFB41BB7A0}" name="proguser_status_id" displayname="Статус" type="INTEGER" default="" primary="false" notnull="true"/>
    <Field id="{A861110A-E8D1-4B67-973C-45D705830DA5}" name="proguser_type" displayname="Тип" type="INTEGER" default="" primary="false" notnull="false"/>
    <Field id="{40C48467-44F7-4C36-88E6-ADF21C978F1C}" name="proguser_name" displayname="Наименование" type="NVARCHAR(50)" default="" primary="false" notnull="true"/>
    <Field id="{0C5718F3-2074-4BD3-8A17-C66F50D443EE}" name="proguser_fullname" displayname="Описание" type="NVARCHAR(50)" default="" primary="false" notnull="false"/>
    <Field id="{0CEB0AA2-C02D-453C-929D-CB4E21AB1111}" name="proguser_webpassword" displayname="WEB пароль" type="NVARCHAR(128)" default="" primary="false" notnull="false"/>
    <Field id="{150309D9-5B94-4F3F-9BD4-0A445B543796}" name="proguser_timezonecode" displayname="Код часового пояса" type="VARCHAR(50)" default="" primary="false" notnull="false"/>
  </FieldList>
  <NaturalKeyList>
    <Fields name="proguser_ak1" displayName="proguser_ak1" id="{CE836EB9-FBCC-4508-8B64-6647195728C1}">
      <FieldRef fieldId="{40C48467-44F7-4C36-88E6-ADF21C978F1C}"/>
    </Fields>
  </NaturalKeyList>
  <IndexList/>
  <References>
    <Reference id="{7B9ADD89-C9D1-4F78-941D-00E2CC640F8E}" name="r" displayName="r" updateConstaint="0" deleteConstaint="0" refTableId="{8A62284E-8EDC-4A8E-8808-65AAE404B7D0}">
      <Source id="{A7813CCC-F8AA-4F69-ADC8-48A54A8F45AB}">
        <FieldRef fieldId="{7816783E-B5B4-4AC5-B37B-C8A7FC2AAC5E}"/>
      </Source>
    </Reference>
    <Reference id="{62C40B54-18E6-45CD-8E3E-A440B922EABE}" name="r" displayName="r" updateConstaint="0" deleteConstaint="0" refTableId="{FA099463-5862-44A7-B9CF-AB34FE463973}">
      <Source id="{72E975B0-A1D7-4E04-8C1C-C826C59DB8E3}">
        <FieldRef fieldId="{7DE7D82C-A345-4847-B16D-35BFB41BB7A0}"/>
      </Source>
    </Reference>
  </References>
</Table>`,
    `<Table id="{0845BB16-D7BA-48E4-BFAF-7EB1A8548A30}" name="proguserext" tableNumid="18808" displayName="Пользователь дополнение" baseTable="" isView="false" version="5">
  <Description></Description>
  <FieldList>
    <Field id="{55947932-75AD-4CFC-8625-4C811DDEDA5A}" name="proguser_id" displayname="Пользователь ИД" type="INTEGER" default="" primary="true"/>
    <Field id="{D4D23629-E994-4239-80DF-39B202CCEF39}" name="proguserext_position" displayname="Должность" type="VARCHAR(200)" default="" primary="false" notnull="false"/>
    <Field id="{58432F8E-CF14-4E3B-96EA-0DEEC68B29DB}" name="proguserext_phone" displayname="Телефон" type="VARCHAR(200)" default="" primary="false" notnull="false"/>
  </FieldList>
  <NaturalKeyList/>
  <IndexList/>
  <References>
    <Reference id="{0A863CCB-9B6C-45CD-BAD2-6CB9BF432195}" name="C" displayName="C" updateConstaint="3" deleteConstaint="3" refTableId="{B96194F5-1263-42A4-843B-E5267C9C678C}">
      <Source id="{2591DBFD-ACAF-40E8-8D45-B803887D1212}">
        <FieldRef fieldId="{55947932-75AD-4CFC-8625-4C811DDEDA5A}"/>
      </Source>
    </Reference>
  </References>
</Table>
`
]

const MermaidChart = React.lazy(() => import('../../lib/MermaidChart'));
export const ModelViewerForm = (props) => {
    const firstInputRef = React.useRef(null);
    const [pages, setPages] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true)
    const [activeKey, setActiveKey] = React.useState(null)

    React.useEffect(() => {
        const timerId = setTimeout(() => {
            if (firstInputRef.current)
                firstInputRef.current.focus({
                    cursor: 'end',
                })
        }, 100);
        return () => {
            clearTimeout(timerId)
        }
    });

    useLayoutEffect(() => {
        refreshSchema()
        setIsLoading(false)
    }, [])


    function mergedArrays(arrays) {
        let result = []
        for (let i = 0; i < arrays.length; i++) {
            result = [...result, ...arrays[i]]
        }
        return result
    }

    const refreshSchema = () => {
        let modelPageViews = props?.form?.getFieldValue("modelPageViews")
        let base64 = modelPageViews && modelPageViews[0]['modelPageData']
        // const pages = parseModel(props.form.getFieldValue("modelPageViews"),
        // props.form.getFieldValue("modelTableViews"))
        console.log(base64)
        let exampleBase64 = 'PABTAGgAYQBwAGUAcwAgAG4AYQBtAGUAPQAiAB8EPgQ6BDAENwQwBEIENQQ7BDgEIAA+BEYENQQ9BDoEOAQgAEEEPgRBBEIEPgRPBD0EOARPBCAAPgQxBEoENQQ6BEIEMAQgAEkASQAiACAAaQBkAD0AIgB7ADAANwAwADMAQwA1AEMAQgAtAEYARAAxAEUALQA0ADcAMAA5AC0AQgA4ADkAMgAtADQANABFADEANAA2ADgANwBFADYARABEAH0AIgA+AA0ACgAgACAAPABUAGEAYgBsAGUAIAB4AD0AIgAtADMAMAAyACIAIAB5AD0AIgAtADEAOQA1ACIAIAB0AGEAYgBsAGUASQBkAD0AIgB7ADYARQA0ADEANwAxADMARAAtADkANwA1AEIALQA0ADYAOABCAC0AQgAxAEMARgAtADUARQBBADkANQAxADUAOQA4ADgAMwAxAH0AIgAgAGkAZAA9ACIAewBCADYAQgBEAEYARAA3AEMALQBDAEMANwBBAC0ANAAyADgANwAtAEIAOAAxAEMALQAxADYARQBDADYAMAA1AEMARQAxAEEANgB9ACIAIAB0AGEAYgBsAGUATgB1AG0AaQBkAD0AIgAxADgAMwA3ADIAIgAgAFAAcgBpAG0AYQByAHkAPQAiAGYAYQBsAHMAZQAiAC8APgANAAoAIAAgADwAVABhAGIAbABlACAAeAA9ACIAMQAzADIAIgAgAHkAPQAiAC0AMwA5ACIAIAB0AGEAYgBsAGUASQBkAD0AIgB7ADEAQwA1AEEAOQBEAEYAQwAtADEANABEADIALQA0ADYARABDAC0AOQBBADMAQgAtADQANwA3ADcAMgBCAEYAMQAzAEQAMgBCAH0AIgAgAGkAZAA9ACIAewBFAEEAMABEAEIAQwBCADQALQBBAEIAMABCAC0ANAA4AEUARgAtADgAMQA0ADgALQAwAEEAMQBFAEEAMgAxAEEANABGAEYAOAB9ACIAIAB0AGEAYgBsAGUATgB1AG0AaQBkAD0AIgAxADgAMwA3ADUAIgAgAFAAcgBpAG0AYQByAHkAPQAiAHQAcgB1AGUAIgAvAD4ADQAKACAAIAA8AFQAYQBiAGwAZQAgAHgAPQAiADEAMgAyACIAIAB5AD0AIgAtADIANwAyACIAIAB0AGEAYgBsAGUASQBkAD0AIgB7AEYAQQAwADkAOQA0ADYAMwAtADUAOAA2ADIALQA0ADQAQQA3AC0AQgA5AEMARgAtAEEAQgAzADQARgBFADQANgAzADkANwAzAH0AIgAgAGkAZAA9ACIAewA2ADgAMwBFAEQAOABCADUALQBCADAAQwBDAC0ANABCAEMAMgAtADgANgBCAEUALQBFAEMAQgAwADIAMQAyADAAOQAxADMAMgB9ACIAIAB0AGEAYgBsAGUATgB1AG0AaQBkAD0AIgAzADEAMwAxACIAIABQAHIAaQBtAGEAcgB5AD0AIgBmAGEAbABzAGUAIgAvAD4ADQAKACAAIAA8AFQAYQBiAGwAZQAgAHgAPQAiAC0AMQA1ADEAIgAgAHkAPQAiADIAMQAxACIAIAB0AGEAYgBsAGUASQBkAD0AIgB7AEEAMgA5ADEAMQA3ADQARAAtAEQARQBEADcALQA0AEQANQBEAC0AQQBCADQANwAtAEYAMwBFAEUAOQAyADcAMAA5ADIAQQBDAH0AIgAgAGkAZAA9ACIAewAzAEIANAA1ADQARQA4ADMALQBDADAAMwBBAC0ANAAxADcARgAtAEIAOQBFADQALQAyADcANgA5ADcAMwAzADgARAA0ADgAOQB9ACIAIAB0AGEAYgBsAGUATgB1AG0AaQBkAD0AIgAxADgAMwA3ADYAIgAgAFAAcgBpAG0AYQByAHkAPQAiAHQAcgB1AGUAIgAvAD4ADQAKACAAIAA8AEwAaQBuAGsAIABzAHIAYwBJAGQAPQAiAHsARQBBADAARABCAEMAQgA0AC0AQQBCADAAQgAtADQAOABFAEYALQA4ADEANAA4AC0AMABBADEARQBBADIAMQBBADQARgBGADgAfQAiACAAZABzAHQASQBkAD0AIgB7ADYAOAAzAEUARAA4AEIANQAtAEIAMABDAEMALQA0AEIAQwAyAC0AOAA2AEIARQAtAEUAQwBCADAAMgAxADIAMAA5ADEAMwAyAH0AIgAgAGYAawBJAGQAPQAiAHsAQgBBADAAMQAwADEANQA3AC0ARABFAEMAQQAtADQAMAA5AEQALQBBADUAMAAyAC0AOABGADEANABDAEMANwA0AEQANQA0AEQAfQAiACAAcgBlAGMAdABhAG4AZwBsAGUAZAA9ACIAdAByAHUAZQAiAD4ADQAKACAAIAAgACAAPABQAG8AaQBuAHQAIAB4AD0AIgAxADIAMgAiACAAeQA9ACIALQAxADAANgAiAC8APgANAAoAIAAgACAAIAA8AFAAbwBpAG4AdAAgAHgAPQAiADEAMgAyACIAIAB5AD0AIgAtADIAMAA1ACIALwA+AA0ACgAgACAAPAAvAEwAaQBuAGsAPgANAAoAIAAgADwATABpAG4AawAgAHMAcgBjAEkAZAA9ACIAewAzAEIANAA1ADQARQA4ADMALQBDADAAMwBBAC0ANAAxADcARgAtAEIAOQBFADQALQAyADcANgA5ADcAMwAzADgARAA0ADgAOQB9ACIAIABkAHMAdABJAGQAPQAiAHsARQBBADAARABCAEMAQgA0AC0AQQBCADAAQgAtADQAOABFAEYALQA4ADEANAA4AC0AMABBADEARQBBADIAMQBBADQARgBGADgAfQAiACAAZgBrAEkAZAA9ACIAewAzADYAQQA3ADgAMwBDADYALQAxADEAMAA2AC0ANAA3ADMANwAtAEEAQgBFADUALQA1ADUARgBFADYANQAyADcANwAwAEEAMgB9ACIAIAByAGUAYwB0AGEAbgBnAGwAZQBkAD0AIgB0AHIAdQBlACIAPgANAAoAIAAgACAAIAA8AFAAbwBpAG4AdAAgAHgAPQAiAC0AMQAxADQAIgAgAHkAPQAiADEANgA1ACIALwA+AA0ACgAgACAAIAAgADwAUABvAGkAbgB0ACAAeAA9ACIALQAxADEANAAiACAAeQA9ACIAMQAyADgAIgAvAD4ADQAKACAAIAAgACAAPABQAG8AaQBuAHQAIAB4AD0AIgA4ADAAIgAgAHkAPQAiADEAMgA4ACIALwA+AA0ACgAgACAAIAAgADwAUABvAGkAbgB0ACAAeAA9ACIAOAAwACIAIAB5AD0AIgAyADgAIgAvAD4ADQAKACAAIAA8AC8ATABpAG4AawA+AA0ACgAgACAAPABMAGkAbgBrACAAcwByAGMASQBkAD0AIgB7ADMAQgA0ADUANABFADgAMwAtAEMAMAAzAEEALQA0ADEANwBGAC0AQgA5AEUANAAtADIANwA2ADkANwAzADMAOABEADQAOAA5AH0AIgAgAGQAcwB0AEkAZAA9ACIAewBCADYAQgBEAEYARAA3AEMALQBDAEMANwBBAC0ANAAyADgANwAtAEIAOAAxAEMALQAxADYARQBDADYAMAA1AEMARQAxAEEANgB9ACIAIABmAGsASQBkAD0AIgB7AEIAMwAzADMAMQBGAEMAMwAtAEMAMABDADQALQA0ADIARQBEAC0AOQAyAEYAMAAtADMARQBGAEMANQA3AEMAOAAwADcAOQA0AH0AIgAgAHIAZQBjAHQAYQBuAGcAbABlAGQAPQAiAHQAcgB1AGUAIgA+AA0ACgAgACAAIAAgADwAUABvAGkAbgB0ACAAeAA9ACIALQAyADAANgAiACAAeQA9ACIAMQA2ADUAIgAvAD4ADQAKACAAIAAgACAAPABQAG8AaQBuAHQAIAB4AD0AIgAtADIAMAA2ACIAIAB5AD0AIgAtADcAOQAiAC8APgANAAoAIAAgADwALwBMAGkAbgBrAD4ADQAKACAAIAA8AFQAZQB4AHQAIAB4AD0AIgAyADUANQAiACAAeQA9ACIALQAxADQAOAAiACAAYwB4AD0AIgAyADUANwAiACAAYwB5AD0AIgA3ADUAIgAgAHQAZQB4AHQAPQAiACIEOAQ/BEsEIAA/BD4EOgQwBDcEMARCBDUEOwQ1BDkEIAA+BEEEPAQ+BEIEQAQwBCYAIwB4AEEAOwBjAGEAcABjAG8AZABlAF8AaQBkADoAJgAjAHgAQQA7ADIAMQAgADEAMgAxACAALQAgACIENQQ6BEMESQQ1BDUEIABBBD4EQQRCBD4ETwQ9BDgENQQgAEAENQQ2BDgEPAQ9BD4EMwQ+BCAAPgQxBEoENQQ6BEIEMAQmACMAeABBADsAMgAxACAAMQAyADIAIAAtACAAHwQ1BEAEOAQ+BDQEOARHBDUEQQQ6BDgEOQQgAD4EQQQ8BD4EQgRABCAAPgQxBEoENQQ6BEIEMAQmACMAeABBADsAMgAxACAAMQAyADMAIAAtACAAEgQ4BDEEQAQ+BDQEOAQwBDMEPQQ+BEEEQgQ4BDoEMAQiACAAZgByAGEAbQBlAFQAeQBwAGUAPQAiADAAIgA+AA0ACgAgACAAIAAgADwARgBvAG4AdAAgAEYAbwBuAHQAXwBOAGEAbQBlAD0AIgBUAGEAaABvAG0AYQAiACAAQwBvAGwAbwByAD0AIgAtADEANgA3ADcANwAyADAAOAAiACAAQwBoAGEAcgBTAGUAdAA9ACIAMQAiACAAUwBpAHoAZQA9ACIAOAAiACAAUwB0AHkAbABlAD0AIgAwACIALwA+AA0ACgAgACAAPAAvAFQAZQB4AHQAPgANAAoAPAAvAFMAaABhAHAAZQBzAD4ADQAKAAAAAAA='
        if (modelPageViews) {
            console.log(parseBase64ToXml(exampleBase64))
        }

        // const pages = parseModel(testPages, testTables)
        // if (pages) {
        //     console.log(pages[0].name)
        //     setActiveKey(pages[0].name)
        // }

        //
        // setPages(pages);

    }

    function onSearch(value) {
        const matches = pages.map((page) => {
            return page['tables'].filter((item) => item['tableName'].includes(value))
        })
        const bestMatch = mergedArrays(matches).sort((a, b) => a['tableName'].length - b['tableName'].length)[0];
        if (bestMatch) {
            setActiveKey(bestMatch['pageName'])
        }
    }

    return <>
        {isLoading
            ? <Spin/>
            : <Form
                {...FORM_ITEMS_LAYOUT}
                form={props.form}
                layout="horizontal"
                name="formSetPassword"
                onFieldsChange={props.onFieldsChange}
                initialValues={props.initialValues}
            >

                <Form.Item
                    valuePropName="modelPageViews"
                    hidden={true}
                />

                <Form.Item
                    valuePropName="modelTableViews"
                    hidden={true}
                />
                <ModuleHeader
                    title={''}
                    showBackButton={false}
                    onSearch={value => onSearch(value)}
                    buttons={[]}
                />
                {pages.length > 0
                    ? <Tabs>
                        {pages.map((page) => {
                        return <TabPane tab={page['name']} key={page['id']}>
                            <Suspense fallback={<div>Загрузка...</div>}>
                                <MermaidChart chart={page['mermaidDiagram']} height={"calc(100vh - 330px)"}/>
                            </Suspense>
                        </TabPane>})}
                    </Tabs>
                    : null
                }
            </Form>
        }
    </>
}