// Контуры (в lowerCase)
export const CONTOUR_ADMIN = { name: "admin", title: "Администрирование"};
export const CONTOUR_REFBOOKS = { name: "refbooks", title: "НСИ" };
export const CONTOUR_DOCUMENTS = { name: "documents", title: "Документы" };

export const CONTOURS = {
    "refbooks": "НСИ",
    "documents": "Документы",
    "admin": "Администрирование",
}

// Модули (в lowerCase)
// В контуре "Администрирование"
export const MODULE_CREDENTIAL = { name: "credential", title: "Учетные данные" };
export const MODULE_AUDIT = { name: "audit", title: "Аудит" };
export const MODULE_SENDERLOG = { name: "audit", title: "Аудит" };
export const MODULE_CONFIG = { name: "config", title: "Конфигуратор" };
// В контуре "НСИ"
export const MODULE_EDIZM = { name: "edizm", title: "Единицы измерения" };
export const MODULE_CAPCLASS = { name: "capclass", title: "Справочники" };
export const MODULE_PERSON = { name: "person", title: "Персоны" };
// В контуре "Документы"
export const MODULE_REQUEST = { name: "request", title: "Заявки" };

export const NONE = {};

export let MODULES: any = {};
MODULES[MODULE_CREDENTIAL.name] = MODULE_CREDENTIAL.title;
MODULES[MODULE_AUDIT.name] = MODULE_AUDIT.title;
MODULES[MODULE_CONFIG.name] = MODULE_CONFIG.title;
MODULES[MODULE_EDIZM.name] = MODULE_EDIZM.title;
MODULES[MODULE_CAPCLASS.name] = MODULE_CAPCLASS.title;
MODULES[MODULE_REQUEST.name] = MODULE_REQUEST.title;
MODULES[MODULE_PERSON.name] = MODULE_PERSON.title;

export const CONTOURS_WITH_MODULES = new Map([
    [CONTOUR_REFBOOKS, [MODULE_EDIZM, MODULE_PERSON, MODULE_CAPCLASS]],
    [CONTOUR_DOCUMENTS, [MODULE_REQUEST]],
    [CONTOUR_ADMIN, [MODULE_CREDENTIAL, MODULE_AUDIT, MODULE_CONFIG]],
]);
