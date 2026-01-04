// @ts-ignore
import  Toastify from 'toastify-js';



interface ToastOptions {
    text: string;
    variant: "success" | "error" | "warning" | "info";

    position?: "left" | "center" | "right";

    duration?: number;

    hasCloseBtn?: boolean;

    class?: string;

    pauseOnHover?: boolean;

    link?: string

    content?: string

}


export default (userOptions: ToastOptions) => {

    const options: any = {
        duration: userOptions.duration || 5000,
        gravity: 'bottom',
        position: 'right',
        text: userOptions.text || "This is a message",
        newWindow: true,
        close: userOptions.hasCloseBtn || false,
        backgroundColor: "",
        className: userOptions.class || "",
        stopOnFocus: userOptions.pauseOnHover || true,
    };

    if (userOptions.link) {
        options.destination = userOptions.link;
    }

    if (userOptions.variant) {
        options.className = `${options.className} ${userOptions.variant}`;
    }

    if (userOptions.content) {
        let node: any = document.querySelector(userOptions.content);
        if (node) {
            node = node.content.firstElementChild.cloneNode(true);
        } else {
            node = undefined
        }
        options.node = node
        options.className += " html";
        options.close = false;
    }

    const toastify = Toastify(options);
    toastify.showToast();

};
