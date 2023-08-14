
export interface Icon {
    src?:string,
    type?:string,
    sizes?:string
}

export interface Manifest {
    name:string,
    short_name:string,
    icons:Icon[],
    start_url:string,
    display:string,
    theme_color:string,
    background_color:string
}



export const retrieveManifest = (setter:(manifest:Manifest)=>void,manifest?:Manifest) => {
    // получим манифест
    if(!manifest) {
        fetch("/manifest.json")
            .then(response => response.json())
            .then((man)=>{
                setter(man);
            })
    }
}