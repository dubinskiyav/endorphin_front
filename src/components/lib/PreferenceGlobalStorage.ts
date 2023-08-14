import requestToAPI from './Request'

// ключ для хранения предпочтений пользователя содержит имя пользователя
const buildKey =  (key: any) => (requestToAPI.user?requestToAPI.user.login:"everybody")+"."+key;
const storage = localStorage;

export const savePreference = (key: string, value: any)=>{
    if(value !== undefined) {
        storage.setItem(buildKey(key),JSON.stringify(value));
    } else {
        storage.removeItem(buildKey(key));
    }
}

export const loadPreference = (key: any)=>{
    const value = storage.getItem(buildKey(key));
    if(value) return JSON.parse(value);
}

export const enumPreferences = (f: (value: any) => void)=>{
    const prefix = buildKey("");
    Object.keys(storage)
        .filter(k=>k.startsWith(prefix))
        .forEach(key=>f(key.slice(prefix.length)));
}

export const dropPreference = (key: any)=>{
    if(Array.isArray(key)) {
        key.forEach((k: any) =>{
            storage.removeItem(buildKey(k));
        })
    } else {
        storage.removeItem(buildKey(key));
    }
}

export const dropAllPreferenceForUser = (userLogin: string)=>{
    Object.keys(storage)
        .filter(k=>k.startsWith(userLogin+"."))
        .forEach(k=>storage.removeItem(k));
}



