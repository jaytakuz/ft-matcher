import { v4 as uuidv4 } from 'uuid'; // อย่าลืม npm install uuid

const GUEST_KEY = 'freetime_guest_token';

export const getGuestToken = () => {
  // 1. ลองดึงจาก LocalStorage ก่อน
  let token = localStorage.getItem(GUEST_KEY);
  
  // 2. ถ้าไม่มี (เข้าครั้งแรก) ให้สร้างใหม่เลย
  if (!token) {
    token = uuidv4();
    localStorage.setItem(GUEST_KEY, token);
  }
  
  return token;
};