import { MSG_NETWORK_ERROR, MSG_NO_ACCESS } from './Const';
import { cleanLocalStorage, cleanSessionStorage, setLocalStorage, setSessionStorage } from "./LoginForm";

/**
 * Версия API с которой работает система
 */
const CURR_VERSION_API = 1

// определяется в .env в момент компиляции!
// добавлена возможность изменения точки доступа к backend без перекомпиляции приложений
// Спрабатывает как поле APP_ENDPOINT в public/config.js При условии, что при сборке в .env
// нет REACT_APP_PROD_ENDPOINT
const BASE_URL = process.env.NODE_ENV == "production"?process.env.REACT_APP_PROD_ENDPOINT || (window as any).env.APP_ENDPOINT
                        :process.env.REACT_APP_DEV_ENDPOINT;

/**
 * Методы API должны возвращать http статус UNAUTHORIZED, если токен устарел или неверен
 */
export const HTTP_STATUS_UNAUTHORIZED = 401;
export const HTTP_STATUS_NOTFOUND = 404;

/**
 * Для работы нужно установить токен доступа к API requestToAPI.token = ...
 * Все методы get, post возвращают Promise
 * Обработка ошибок в двух случаях
 * 1: HTTP статус != 200
 * 2. HTTP статус = 200. Ошибка в самом json ответе
 */
/** это имя свойства в ответе, наличие которого сигнализирует об ошибке */
const ERROR_PROP_NAME = "errorCode";
/** это имя свойства в ответе, где сообщение об ошибке */
const ERROR_MESSAGE_PROP_NAME = "errorMessage";

export const ERROR_CODES = {
    UNKNOWN_ERROR: 100,
    /** Отсутствует сортировка при наличии пагинации */
    BAD_PAGING_NO_SORT: 123,
    /** Ошибка при выборке данных */
    FETCH_ERROR: 124,
    /** Ошибка при сохранении данных */
    POST_ERROR: 125,
    /** Ошибка при удалении данных */
    DELETE_ERROR: 126,

    USER_LOCKED: 127,
    USER_OR_PASSWORD_INCORRECT: 128,
    TOKEN_INCORRECT: 129,
    TOKEN_EXPIRED: 140,

    ACCESS_DENIED: 130,
    TEMPORARY_ACCESS: 131
}

export class CustomError extends Error {
    status = 400;

    constructor(status: number, message: string) {
        super(message);

        this.status = status;

        Object.setPrototypeOf(this, CustomError.prototype);
    }
}

type IUser = {
    login: string | null,
    name: string | null
}

const requestToAPI = {
    token: undefined as undefined | string,   // token доступа
    /**
     * информация о текущем пользователе. Объект
     * {
     *  name:"фио пользователя",
     *  login:"логин пользователя"
     * }
     */
    user: undefined as IUser | undefined,
    /**
     * @param {*} url - если начинается с / то префиксы к url не добавляются
     * @param {*} data - данные в теле запроса в виде объекта
     * @param {*} config - опции: extResponse - в then передается полный ответ (с заголовками, статусом и т.д), иначе только payload
     * @returns
     */
    get: (url: string, config: any) => {
        config = config || {};
        return new Promise((resolve, reject) => {
            const options: any = {
                method: 'get',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: "omit"
            };
            if(requestToAPI.token) {
                options.headers['Authorization'] = 'Bearer ' + requestToAPI.token
            }
            fetch(BASE_URL + "/" + requestToAPI.getUrl(url), options)
                .then(response => {
                    if (!response.ok) {
                        let status = response.status,
                            statusText = response.statusText;

                        if (status == HTTP_STATUS_UNAUTHORIZED) {
                            statusText = MSG_NO_ACCESS;
                        }
                        if(status == HTTP_STATUS_NOTFOUND) {
                            statusText = `Адрес ${response.url} не найден`;
                        }
                        reject({message:statusText,status:status});

                    } else {
                        if (config.extResponse) {
                            return response;
                        } else {
                            return response.json().catch(err => {
                                reject(err);
                                return undefined;
                            });
                        }
                    }
                })
                .then(json => {
                    if (json && json.fieldErrors && Object.keys(json.fieldErrors).length !== 0) {
                        reject({ message: Object.keys(json.fieldErrors).map(value => json.fieldErrors[value]).join(". ")});
                    } else if (json && json[ERROR_PROP_NAME]) {
                        reject({ message: json[ERROR_MESSAGE_PROP_NAME] });
                    } else {
                        resolve(json);
                    }
                })
                .catch((error) => {
                    if (error.status) {
                        reject(error);
                    } else {
                        reject({ message: MSG_NETWORK_ERROR });
                    }
                })
        });

    },
    /**
     * @param {*} url - если начинается с / то префиксы к url не добавляются
     * @param {*} data - данные в теле запроса в виде объекта
     * @param {*} config - опции:
     *  - extResponse - в then передается полный ответ (с заголовками, статусом и т.д), иначе только payload
     *  - noStringify - передавать в body объект как есть (не переводить в JSON)
     *  - headers - дополнительные заголовки
     * @returns
     */
    post: (url: string, data?: any, config: any= undefined) => {
        config = config || {};
        const headers = {
            'Content-Type': 'application/json',
            'Client-Timezone':Intl.DateTimeFormat().resolvedOptions().timeZone,
            ...config.headers
        }
        if(requestToAPI.token) {
            headers['Authorization'] = 'Bearer ' + requestToAPI.token
        }
        if(config.noContentType) {
            delete headers['Content-Type'];
        }
        return new Promise((resolve, reject) => {
            const options: any = {
                method: 'post',
                mode: 'cors',
                body: config.noStringify?data:JSON.stringify(data),
                headers: headers,
                credentials: "omit"
            };
            fetch(BASE_URL + "/" + requestToAPI.getUrl(url), options)
                .then(response => {
                    if (!response.ok) {
                        let status = response.status,
                        statusText = response.statusText;
                        if (status == HTTP_STATUS_UNAUTHORIZED) {
                            statusText = MSG_NO_ACCESS;
                        }
                        if(status == HTTP_STATUS_NOTFOUND) {
                            statusText = `Адрес ${response.url} не найден`;
                        }

                        reject({message:statusText,status:status});

                    } else {
                        if (config.extResponse) {
                            return response;
                        } else {
                            // catch нужен когда с сервера приходит null
                            return response.json().catch(err => {
                                reject(err);
                                return undefined;
                            });
                        }
                    }
                })
                .catch((error) => {
                    console.error(error);
                    if (error.status || error.name=="SyntaxError") {
                        reject(error);
                    } else {
                        reject({ message: MSG_NETWORK_ERROR })
                    }
                })
                .then(json => {
                    if (json && json.fieldErrors && Object.keys(json.fieldErrors).length !== 0) {
                        reject({ message: Object.keys(json.fieldErrors).map(value => json.fieldErrors[value]).join(". ")});
                    } else if (json && json[ERROR_PROP_NAME]) {
                        reject({message: json[ERROR_MESSAGE_PROP_NAME],[ERROR_PROP_NAME]:json[ERROR_PROP_NAME]});
                    } else {
                        resolve(json);
                    }
                })
        });
    },
    getUrl: (url: string) => {
        // если от корня то префиксы не вставляем
        if (url.startsWith("/")) {
            return url.substring(1);
        }
        // исключение - обращение в незащищенную зону security
        if(url.startsWith("$")) {
            return "security/"+url.substring(1);
        }
        // исключение - обращение в незащищенную зону public
        if(url.startsWith("*")) {
            return "public/"+url.substring(1);
        }
        return ((url === "gettoken" || url === "renew") ? "security/" : "v" + CURR_VERSION_API + "/apps/") + url;
    },
    renew: (replayUrl: string, replayData: any) => {
        return new Promise((resolve, reject) => {
            requestToAPI.post("renew", { "token": requestToAPI.token })
                .then((response: any) => {
                    requestToAPI.token = response.token;
                    requestToAPI.user = {
                        login: response.userLogin,
                        name: response.userName,
                    };

                    if (sessionStorage.getItem("token")) {
                        setSessionStorage(requestToAPI.token, requestToAPI.user);
                    } else {
                        cleanSessionStorage();
                    };

                    if (localStorage.getItem("token")) {
                        setLocalStorage(requestToAPI.token, requestToAPI.user);
                    } else {
                        cleanLocalStorage();
                    };

                    requestToAPI.post(replayUrl, replayData)
                        .then(response => {
                            resolve(response);
                        })
                        .catch(() => {
                            reject();
                        })
                })
                .catch(() => {
                    reject();
                })
        })
    }
}

export default requestToAPI;
