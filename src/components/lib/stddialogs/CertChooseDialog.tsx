import React from 'react';
import { Modal,Tooltip, List, Button, notification } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';    
import {jss} from "react-jss";
import { PRIMARY_COLOR_LIGHT } from '../StyleConst';
import { parseDN } from '../Utils';

interface Certificate {
    thumbprint: string,
    subjectInfo: string,
    issuerInfo:string,
    validPeriod:{from:string, to:string} //ISO
}

const copyToClipBoard = async (text:string | undefined) => {
    try {
        await navigator.clipboard.writeText(text || '');
        notification.success({message:"Данные успешно скопированы"})
    } catch (err) {
        notification.error({message:"Ошибка копирования в буфер",description:err})
    }
  };



export const showCertificateChooseDialog = (certList: Certificate[], finalyCB: (result:boolean,cert?:Certificate)=>void) => {
    const styles = {
        list: {
            '& .ant-list-item':{
                padding:'8px'
            },            
            '& .ant-list-item:hover':{
                backgroundColor:PRIMARY_COLOR_LIGHT,
                cursor:'pointer',
            }
        },
        center:{
            textAlign:'center'
        },
        info:{
            display: 'inline-block',
            position: 'absolute',
            top: '12px',
            right: '8px'            
        }
    }
    
    const {classes} = jss.createStyleSheet(styles).attach()
    
    let closeDialogFunc:()=>void;

    const chooseCert = (cert:Certificate)=>{
        finalyCB(true,cert);
        closeDialogFunc();
    }

    const getCertInfo = (cert:any,subjectInfo:string,issuerInfo:any)=>{
        const id = ''+Math.random()*1000;
        return <div>
            <div id={id}>
                <div className={classes.center}>Серийный номер</div>
                <div>{cert.serialNumber}</div>
                <div className={classes.center}>Издатель</div>
                <div>УЦ: {issuerInfo.CN[0]}</div>
                <div>Организация: {issuerInfo.O[0]}</div>
                <div>Страна/Регион: {issuerInfo.C[0]}</div>
                <div>Город: {issuerInfo.L[0]}</div>
                <div>Субъект: {issuerInfo.S[0]}</div>
                <div>{issuerInfo.STREET?"Адрес: "+issuerInfo.STREET[0]:''}</div>
                <div>{issuerInfo['ИНН']?"ИНН: "+issuerInfo['ИНН'][0]:''}</div>
                <div>{issuerInfo['ОГРН']?"ОГРН: "+issuerInfo['ОГРН'][0]:''}</div>
                <div>E-mail: {issuerInfo.E?issuerInfo.E[0]:''}</div>
            </div>
            <div className={classes.center} style={{padding:'8px'}}>
                <Button onClick={(ev)=>{
                        copyToClipBoard(subjectInfo+' '+document.getElementById(id)?.innerText);
                    }}>Скопировать в буфер</Button>
                </div>            
        </div>
    }
        
    

    const dialog = Modal.confirm({
        centered:true,
        title: 'Выбор сертификата',
        width: "50%",
        content: (
            <List dataSource={certList} className={classes.list} 
                renderItem={cert => {
                    const subjectInfo = parseDN(cert.subjectInfo);
                    const issuerInfo = parseDN(cert.issuerInfo);
                    
                    return <List.Item key={cert.thumbprint} onClick={()=>chooseCert(cert)}>
                        {subjectInfo.CN[0]+', '+issuerInfo.CN[0]}
                        <div onClick={(ev)=>ev.stopPropagation()}>
                            <Tooltip placement={"right"} title={()=>getCertInfo(cert,subjectInfo.CN[0],issuerInfo)} destroyTooltipOnHide>
                                <InfoCircleOutlined className={classes.info}/>
                            </Tooltip>    
                        </div>
                    </List.Item>
              }}/>
        ),
        onCancel: () => finalyCB(false),
        okButtonProps:{style:{display:'none'}}
    });

    closeDialogFunc = ()=>dialog.destroy()

}    

