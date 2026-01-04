import {defineStore} from "pinia";
import {type RemovableRef, useStorage} from "@vueuse/core";

interface GlobalState {
    darkMode: boolean | RemovableRef<boolean>;
    monoChrome: boolean | RemovableRef<boolean>;
    sidebarExpanded: boolean
    searchbarActive: boolean | RemovableRef<boolean>;
    rightSidebarExpanded: boolean | RemovableRef<boolean>;
    ready: boolean

}

export const useGlobalState = defineStore({
    id: 'global',
    state: (): GlobalState => ({
        darkMode: useStorage('darkMode', false),
        monoChrome: useStorage('monoChrome', false),
        sidebarExpanded: false,
        searchbarActive: useStorage('searchbarActive', false),
        rightSidebarExpanded: useStorage('rightSidebarExpanded', false),
        ready: true
    }),
    getters: {
        isReady(): boolean {
            return this.ready
        },
        isDarkMode(): boolean {
            return this.darkMode
        },
        isMonoChrome(): boolean {
            return this.monoChrome
        },
        isSidebarExpanded(): boolean {
            return this.sidebarExpanded
        },
        isSearchbarActive(): boolean {
            return this.searchbarActive
        },
        isRightSidebarExpanded(): boolean {
            return this.rightSidebarExpanded
        }

    },
    actions: {
        setReady(value: boolean) {
            this.ready = value
        },
        setRightSidebarExpanded(value: boolean) {
            this.rightSidebarExpanded = value
        },
        setSideBarExpanded(value: boolean) {
            this.sidebarExpanded = value
        },
        openSearchBar() {
            this.searchbarActive = true
        },
        closeSearchBar() {
            this.searchbarActive = false
        },
        toggleDarkMode() {
            this.darkMode = !this.darkMode
            if (this.darkMode) {
                document.documentElement.classList.add('dark')
            } else {
                document.documentElement.classList.remove('dark')
            }
        },
        toggleMonochrome() {
            this.monoChrome = !this.monoChrome
            if (this.monoChrome) {
                document.body.classList.add('is-monochrome')
            } else {
                document.body.classList.remove('is-monochrome')
            }
        },
        toggleSidebar() {
            this.sidebarExpanded = !this.isSidebarExpanded
            if (this.sidebarExpanded) {
                document.body.classList.add('is-sidebar-open')
            } else {
                document.body.classList.remove('is-sidebar-open')
            }
        },
        toggleSearchbar() {
            this.searchbarActive = !this.searchbarActive
        },
        toggleRightSidebar() {
            this.rightSidebarExpanded = !this.rightSidebarExpanded
        }
    }
})