import * as CryptoJS from 'crypto-js';
import padZeroPadding from 'crypto-js/pad-zeropadding'
import { JSEncrypt } from 'jsencrypt'

export function debounceFunction(fn: Function, delay: number): Function {
    let timeoutID: NodeJS.Timeout | null = null;
    return function (...args: any[]) {
        if (timeoutID) {
            clearTimeout(timeoutID);
        }
        timeoutID = setTimeout(() => fn(...args), delay);
    }
}

export function generateImageByName(name: string, size: number = 100): string {
    
    return `https://ui-avatars.com/api/?name=${name}&color=7F9CF5&background=EBF4FF&size=${size}`
}

export class Cipher {

    private static password: string = import.meta.env.VITE_CLIENT_PUBLIC_KEY as string;
    private static publicKeyPem: string = import.meta.env.VITE_PUBLIC_KEY as string;

    static encrypt(text: string): string {

        return CryptoJS.AES.encrypt(text.toString(), this.password, {
            padding: padZeroPadding
        }).toString();
    }

    static simpleEncrypt(text: string): string {
        // the hash must be equal in all encrypts
        return CryptoJS.SHA256(text).toString();
    }

    static encryptReturnObject(text: string): any {
        // Convert text to WordArray
        const encrypt = new JSEncrypt();
        encrypt.setPublicKey(this.publicKeyPem);
        return {
            encrypted: encrypt.encrypt(text)
        }
    }

    static decrypt(encryptedText: string): string {
        const bytes = CryptoJS.AES.decrypt(encryptedText, this.password);
        return bytes.toString(CryptoJS.enc.Utf8);
    }
}

export function generateRandomHash(length: number = 32): string {

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let hash = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        hash += characters[randomIndex];
    }

    return hash;
}
