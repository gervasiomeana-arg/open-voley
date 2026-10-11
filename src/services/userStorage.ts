// Legacy unscoped data is deliberately not imported into a newly authenticated account.
let userId='guest';
export function setStorageUser(id:string|null){userId=id || 'guest'}
export function getStorageUser(){return userId}
export const userStorage={
 getItem(key:string){return localStorage.getItem(`ov-user:${encodeURIComponent(userId)}:${key}`)},
 setItem(key:string,value:string){localStorage.setItem(`ov-user:${encodeURIComponent(userId)}:${key}`,value)},
 removeItem(key:string){localStorage.removeItem(`ov-user:${encodeURIComponent(userId)}:${key}`)},
};
