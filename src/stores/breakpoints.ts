import {defineStore} from "pinia";


interface breakpointsState {
    resizeTimeout: number;
    height: number;
    width: number,
    name: string,
    isBreakpointChanged: boolean,
    isXs: boolean,
    isSm: boolean,
    isMd: boolean,
    isLg: boolean,
    isXl: boolean,
    is2xl: boolean,

    smAndDown: boolean,
    smAndUp: boolean,
    mdAndDown: boolean,
    mdAndUp: boolean,
    lgAndDown: boolean,
    lgAndUp: boolean,
    xlAndDown: boolean,
    xlAndUp: boolean,

    sm: number,
    md: number,
    lg: number,
    xl: number,
    the2xl: number,
}


export const useBreakpoints = defineStore({
    id: 'breakpoints',
    state: (): breakpointsState => ({
        resizeTimeout: 0,
        height: 0,
        width: 0,
        name: "",
        isBreakpointChanged: false,
        isXs: false,
        isSm: false,
        isMd: false,
        isLg: false,
        isXl: false,
        is2xl: false,

        smAndDown: false,
        smAndUp: false,
        mdAndDown: false,
        mdAndUp: false,
        lgAndDown: false,
        lgAndUp: false,
        xlAndDown: false,
        xlAndUp: false,

        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        the2xl: 1536,
    }),
    actions: {
        update() {
            const height = window.innerHeight;
            const width = window.innerWidth;
            const xs = width < this.sm;
            const sm = width < this.md && !xs;
            const md = width < this.lg && !(sm || xs);
            const lg = width < this.xl && !(md || sm || xs);
            const xl = width < this.the2xl && !(lg || md || sm || xs);
            const the2xl = width >= this.the2xl;

            this.height = height;
            this.width = width;

            this.isXs = xs;
            this.isSm = sm;
            this.isMd = md;
            this.isLg = lg;
            this.isXl = xl;
            this.is2xl = the2xl;

            this.smAndDown = (xs || sm) && !(md || lg || xl || the2xl);
            this.smAndUp = !xs && (sm || md || lg || xl || the2xl);
            this.mdAndDown = (xs || sm || md) && !(lg || xl || the2xl);
            this.mdAndUp = !(xs || sm) && (md || lg || xl || the2xl);
            this.lgAndDown = (xs || sm || md || lg) && !(xl || the2xl);
            this.lgAndUp = !(xs || sm || md) && (lg || xl || the2xl);
            this.xlAndDown = (xs || sm || md || lg || xl) && !the2xl;
            this.xlAndUp = !(xs || sm || md || lg) && (xl || the2xl);

            if (xs) this.name = "xs";
            if (sm) this.name = "sm";
            if (md) this.name = "md";
            if (lg) this.name = "lg";
            if (xl) this.name = "xl";
            if (the2xl) this.name = "2xl";

            document.documentElement.style.setProperty("--vh", `${height * 0.01}px`);
        },
        onResize() {

            this.resizeTimeout = window.setTimeout(this.update.bind(this), 175);
            // clearTimeout(this.resizeTimeout);
        },
        init() {
            this.update();
            window.addEventListener("resize", this.onResize, {
                passive: true,
            });
        },
    }
});
