import {Buffer} from 'buffer';
import type {Keys} from "@/bin/platform/chat/store/ChatFriendListStore";

window.Buffer = Buffer;

export class SynomSafeBox {

    static async generateKeysForUser(): Promise<{ publicKey: string, privateKey: string }> {


        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: "RSA-OAEP",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]), // 65537
                hash: "SHA-1",
            },
            true,
            ["encrypt", "decrypt"]
        );


        const publicKey = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
        const privateKey = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);


        const publicKeyStr = JSON.stringify(publicKey);
        const privateKeyStr = JSON.stringify(privateKey);

        await this.storeKeys(privateKeyStr, publicKeyStr);

        return publicKey
    }

    static async openDatabase(version: number): Promise<IDBDatabase> {
        return new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open(import.meta.env.VITE_APP_ID, version);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                if (!db.objectStoreNames.contains('keys')) {
                    db.createObjectStore('keys', {keyPath: 'id'});
                }
            };

            request.onsuccess = (event) => {
                resolve((event.target as IDBOpenDBRequest).result);
            };

            request.onerror = (event) => {
                reject(new Error('Error opening IndexedDB: ' + (event.target as IDBRequest).error));
            };
        });
    }

    static async storeKeys(privateKey: string, publicKey: string): Promise<void> {
        const db = await this.openDatabase(2); // Use a versão adequada do banco de dados
        return new Promise<void>((resolve, reject) => {
            const tx = db.transaction('keys', 'readwrite');
            const store = tx.objectStore('keys');

            const putRequests = [
                store.put({id: 'privateKey', key: privateKey}),
                store.put({id: 'publicKey', key: publicKey})
            ];

            let completedRequests = 0;

            putRequests.forEach(request => {
                request.onsuccess = () => {
                    completedRequests++;
                    if (completedRequests === putRequests.length) {
                        tx.oncomplete = () => {
                            db.close();
                            resolve();
                        };
                    }
                };

                request.onerror = (e) => {
                    reject(new Error('Error storing keys: ' + (e.target as IDBRequest).error));
                };
            });
        });
    }

    static async hasKey(keyType: 'privateKey' | 'publicKey'): Promise<boolean> {
        const db = await this.openDatabase(2);
        return new Promise<boolean>((resolve, reject) => {
            const tx = db.transaction('keys', 'readonly');
            const store = tx.objectStore('keys');

            const getRequest = store.get(keyType);

            getRequest.onsuccess = () => {
                tx.oncomplete = () => {
                    db.close();
                };
                resolve(getRequest.result !== undefined);
            };

            getRequest.onerror = (e) => {
                reject(new Error('Error retrieving key from IndexedDB: ' + (e.target as IDBRequest).error));
            };
        });
    }

    static async deleteKey(keyType: 'privateKey' | 'publicKey'): Promise<void> {
        const db = await this.openDatabase(2); // Aumente a versão se necessário
        return new Promise<void>((resolve, reject) => {
            const tx = db.transaction('keys', 'readwrite');
            const store = tx.objectStore('keys');

            const deleteRequest = store.delete(keyType);

            deleteRequest.onsuccess = () => {
                tx.oncomplete = () => {
                    db.close();
                    resolve();
                };
            };

            deleteRequest.onerror = (e) => {
                reject(new Error('Error deleting key from IndexedDB: ' + (e.target as IDBRequest).error));
            };
        });
    }

    static async retrieveKey(keyType: 'privateKey' | 'publicKey'): Promise<string | undefined> {
        const db = await this.openDatabase(2);
        return new Promise<string | undefined>((resolve, reject) => {
            const tx = db.transaction('keys', 'readonly');
            const store = tx.objectStore('keys');

            const getRequest = store.get(keyType);

            getRequest.onsuccess = () => {
                tx.oncomplete = () => {
                    db.close();
                };
                resolve(getRequest.result ? getRequest.result.key : undefined);
            };

            getRequest.onerror = (e) => {
                reject(new Error('Error retrieving key from IndexedDB: ' + (e.target as IDBRequest).error));
            };
        });
    }

    static async encrypt(jwk: JsonWebKey, data: string): Promise<string> {
        // Import the public key
        let publicKey = await this.importKey(jwk, "public");

        // Convert the string data to ArrayBuffer
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);

        // Encrypt the data
        const result = await window.crypto.subtle.encrypt(
            {
                name: "RSA-OAEP"
            },
            publicKey,
            dataBuffer
        );

        // Encode the result as a base64 string
        return btoa(String.fromCharCode(...new Uint8Array(result)));
    }

    static async importKey(jwk: JsonWebKey, keyType: 'private' | 'public'): Promise<CryptoKey> {
        console.log(`Importing ${keyType} key:`, jwk);
        return await window.crypto.subtle.importKey(
            "jwk",
            jwk,
            { name: "RSA-OAEP", hash: "SHA-1" },
            true,
            [keyType === 'private' ? 'decrypt' : 'encrypt']
        );
    }

    static async exportKey(jwk: JsonWebKey, keyType: 'private' | 'public'): Promise<CryptoKey> {
        let key = await this.importKey(jwk, keyType)
        return await this.exportKeyToPEM(key, keyType)
    }

    private static async exportKeyToPEM(key: CryptoKey, keyType: 'private' | 'public'): Promise<string> {
        let exportFormat: string;
        let pemHeader: string;
        let pemFooter: string;

        if (keyType === 'private') {
            exportFormat = "pkcs8";
            pemHeader = "-----BEGIN PRIVATE KEY-----";
            pemFooter = "-----END PRIVATE KEY-----";
        } else if (keyType === 'public') {
            exportFormat = "spki";
            pemHeader = "-----BEGIN PUBLIC KEY-----";
            pemFooter = "-----END PUBLIC KEY-----";
        } else {
            throw new Error("Invalid key type. Use 'private' or 'public'.");
        }

        const exported = await window.crypto.subtle.exportKey(
            exportFormat,
            key
        );


        const exportedAsBase64 = window.btoa(String.fromCharCode(...new Uint8Array(exported)));


        return `${pemHeader}\n${exportedAsBase64.match(/.{1,64}/g).join('\n')}\n${pemFooter}`;
    }

    static async decryptSessionKey(encryptedSessionKeyBase64: string, jwk: JsonWebKey): Promise<string | null> {
        try {
            console.log("Decrypting session key with JWK:", jwk);
            let privateKey = await this.importKey(jwk, "private");
            console.log("Imported private key:", privateKey);

            console.log("Encrypted session key (Base64):", encryptedSessionKeyBase64);
            const encryptedSessionKey = Uint8Array.from(atob(encryptedSessionKeyBase64), c => c.charCodeAt(0));
            console.log("Encrypted session key (Uint8Array):", encryptedSessionKey);

            const result = await window.crypto.subtle.decrypt(
                { name: "RSA-OAEP" },
                privateKey,
                encryptedSessionKey
            );

            console.log("Decrypted result (ArrayBuffer):", result);

            let text = new TextDecoder();
            let decryptedText = text.decode(result);
            console.log("Decrypted session key (text):", decryptedText);

            return decryptedText;
        } catch (e) {
            console.error('Decryption failed:', e);
            return null;
        }
    }

    static async decryptMessage(encryptedMessageBase64: string, encryptedSessionKeyBase64: string | null): Promise<string> {
        if (!encryptedSessionKeyBase64) return null

        const {sessionKey, decryptedSessionKey} = await this.importSessionKey(encryptedSessionKeyBase64);

        const encryptedArray = this.base64ToUint8Array(encryptedMessageBase64);

        const iv = await this.deriveIV(decryptedSessionKey);

        const decryptedBuffer = await window.crypto.subtle.decrypt(
            {
                name: "AES-CBC",
                iv: iv,
            },
            sessionKey,
            encryptedArray
        );

        const decoder = new TextDecoder();
        return decoder.decode(decryptedBuffer);
    }

    static async encryptMessage(content: string, encryptedSessionKeyBase64: string): Promise<string> {
        let {sessionKey, decryptedSessionKey} = await this.importSessionKey(encryptedSessionKeyBase64);


        const encoder = new TextEncoder();
        const messageBuffer = encoder.encode(content);


        const iv = await this.deriveIV(decryptedSessionKey);

        const encryptedBuffer = await window.crypto.subtle.encrypt(
            {
                name: "AES-CBC",
                iv: iv,
            },
            sessionKey,
            messageBuffer
        );

        const encryptedArray = new Uint8Array(encryptedBuffer);

        return this.uint8ArrayToBase64(encryptedArray); // Return the Base64-encoded encrypted data
    }

    private static uint8ArrayToBase64(uint8Array: Uint8Array): string {
        let binary = '';
        const len = uint8Array.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(uint8Array[i]);
        }
        return window.btoa(binary);
    }

    private static base64ToUint8Array(base64: string): Uint8Array {
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }

    private static async deriveIV(nonce: string): Promise<Uint8Array> {

        const encoder = new TextEncoder();
        const nonceBuffer = encoder.encode(nonce);

        const hashBuffer = await window.crypto.subtle.digest("SHA-256", nonceBuffer);

        return new Uint8Array(hashBuffer).slice(0, 16);
    }

    static async importSessionKey(encryptedSessionKeyBase64: string) {
        let privateKey = JSON.parse(await this.retrieveKey("privateKey"))
        let decryptedSessionKey = await this.decryptSessionKey(encryptedSessionKeyBase64, privateKey);
        let hexDecryptedSessionKey = this.hexStringToUint8Array(decryptedSessionKey);
        const sessionKey = await window.crypto.subtle.importKey(
            "raw",
            hexDecryptedSessionKey,
            {name: "AES-CBC"},
            false,
            ["encrypt", "decrypt"]
        );

        return {sessionKey, decryptedSessionKey};
    }

    private static hexStringToUint8Array(hexString) {
        try {
            console.log(hexString)
            if (hexString.length % 2 !== 0) {
                return []
            }
            const arrayBuffer = new Uint8Array(hexString.length / 2);
            for (let i = 0; i < hexString.length; i += 2) {
                arrayBuffer[i / 2] = parseInt(hexString.substr(i, 2), 16);
            }
            return arrayBuffer;
        } catch (e) {
            console.log(e)
            return []
        }
    }

    static retrieveKeyByMeta(sessionKeys: Keys[], meta: string) {
        return sessionKeys.find((item) => {
            return meta == item.meta
        })
    }

}
