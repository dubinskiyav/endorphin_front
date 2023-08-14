import React, {FC} from 'react';
import { Modal, Upload,Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import requestToAPI from "./Request";

// Типы ЭМ
const  APPENDIX_TYPE_FILE = 756;
const  APPENDIX_TYPE_IMAGE = 435;
const  APPENDIX_TYPE_DOCUMENT = 94;
const  APPENDIX_TYPE_OTHER = 917;

const getBase64 = (file: any) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });


/*
  [
      {
      uid: '-1',
      name: 'image.png',
      status: 'done' || 'uploading' || 'error',
      url: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
      }
  ]
*/


interface AppendixGalleryProps {
    defaultFileList: [],
    fileList: [],
    interface: any,
    onChange: () => void,
    loading: boolean
}
const AppendixGallery: FC<AppendixGalleryProps> = ({defaultFileList=[],  loading= false, ...props}) => {
    const [previewVisible, setPreviewVisible] = React.useState(false);
    const [previewImage, setPreviewImage] = React.useState('');
    const [previewTitle, setPreviewTitle] = React.useState('');
    const [fileList, setFileList] = React.useState(defaultFileList);
    const [removeFiles, setRemoveFiles] = React.useState<any[]>([]);


    // полу-управляемый режим. defaultFileList не подходит, так как состояние извне не обновить
    React.useEffect(()=>{
        if(props.fileList) {
            setFileList(props.fileList);
        }
    },
    [props.fileList])

    const handleCancel = () => setPreviewVisible(false);

    const handlePreview = async (file: any) => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj);
        }

        setPreviewImage(file.url || file.preview);
        setPreviewVisible(true);
        setPreviewTitle(file.name || file.url.substring(file.url.lastIndexOf('/') + 1));
    };

    const handleChange = ({ fileList: newFileList}: any) => {
        setFileList(newFileList);
        if(props.onChange) {
            props.onChange();
        }
    };

    const handleUpload = () => {
        let pendingTasks = [];
        // удаляем
        const ids = removeFiles.map((f: any) => parseInt(f.uid))
        if(ids.length>0) {
            pendingTasks.push(
                requestToAPI.post("refbooks/files/appendix/delete",ids)
                    .then(resp=>{
                        setRemoveFiles([]);
                        return null;
                    })
            );
        }
        //заливаем
        fileList.filter((f: any) =>f.new).forEach((f: any) =>{
            const apdx = {
                capclassId:APPENDIX_TYPE_IMAGE,
                appendixName:f.name,
            }
            f.status = 'uploading';
            f.percent=25;
            pendingTasks.push(
                requestToAPI.post("refbooks/files/appendix/save",apdx)
                    .then((resp: any) =>{
                        f.percent=50;
                        f.uid = resp.appendixId;
                        return resp.appendixId;
                    })
                    .then(appendixId=>{
                        const formData = new FormData();
                        formData.append("upload",f.originFileObj);
                        return requestToAPI.post(`refbooks/files/appendix/upload/${appendixId}`,
                                        formData,{
                                            noStringify:true,
                                            noContentType:true
                                        })
                    })
                    .then(()=>{
                        console.log("props",props);
                        delete f.new;
                        return f.uid;
                    })
                    .finally(()=>{
                        f.percent=100;
                        f.status = 'done';
                    })
            )
        })

        return Promise.all(pendingTasks);
    }

    const uploadButton = (
        <div>
            {
                loading
                    ?
                    <>
                        <Spin/>
                        <div style={{marginTop: 8}}>Читаем...</div>
                    </>
                    :
                    <>
                        <PlusOutlined />
                        <div style={{marginTop: 8}}>Загрузить</div>
                    </>
            }
        </div>
    );

    if(props.interface) {
        props.interface.upload = handleUpload;
    }

    return (
        <>
            <Upload
                listType="picture-card"
                fileList={fileList}
                onPreview={handlePreview}
                beforeUpload={(file: any) => {
                    file.new = true;
                    return false;
                }}
                onRemove={(file: any) => {
                    if (!file.new) {
                        setRemoveFiles([...removeFiles, file])
                    }
                    return true;
                }}
                onChange={handleChange}
            >
                {uploadButton}
            </Upload>
            <Modal visible={previewVisible} title={previewTitle} footer={null} onCancel={handleCancel}>
                <img
                    alt="example"
                    style={{
                        width: '100%',
                    }}
                    src={previewImage}
                />
            </Modal>
        </>
    );
};

export default AppendixGallery;
