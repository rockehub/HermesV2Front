import notification from "@/helpers/utils/notification";

export class ErrorHandler {
    notification = notification

    static handle(error: any, message?: string) {
        message = message || error.message || "Error"
        message == undefined ? notification({text: "Error", variant: "error"}) :
        notification({text: message, variant: "error"});
    }
}