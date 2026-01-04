import {$axios} from "@/helpers/integration/integration";

export default class UploadFileStrategy {
    static uploadFile(file: File, onUploadProgress: any, session?: number|undefined|null) {
        const formData = new FormData();
        formData.append("file", file);
        if (session) {
            formData.append("session_id", session.toString());
        }
        return $axios.post("/files/upload", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
            onUploadProgress
        });

    }

}