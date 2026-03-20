import {menuItems} from "@/helpers/extensionLoader/extension-loader";
import {useBreakpoints} from "@/stores/breakpoints";
import { $axios } from "@/helpers/integration/integration";
import { type Component } from 'vue'
import type { FieldType, RegisteredField } from '@/classes/form/FieldRegistry'
import type { AnyFieldSchema } from '@/classes/form/schemas'


declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $toast: any
        $menu: ReturnType<typeof menuItems>;
        $breakpoints: ReturnType<typeof useBreakpoints>;
        $socket: unknown;
        $axios: typeof $axios;
        $t: (key: string, ...args: unknown[]) => string;
    }
}

declare global {
    interface Window {
        downloadI18nKeys?: () => void;
        showI18nKeys?: () => void;
        clearI18nKeys?: () => void;
    }
}

export type UploadingStatus = "pending" | "uploading" | "failed" | "success";

export interface SelectedFile {
    file: File;
    percentage: number;
    status: UploadingStatus;
}

export interface FileUpload {
    file_name: string
    disk_name: string
    user_id: number
    file_size: number
    content_type: string
    attachment_type: string
    access_key: string
    is_public: boolean
    updated_at: string
    created_at: string
    id: number
}

export interface MenuItem {
    name: string;
    icon: MenuIcon;
    label: string;
    params?: any
    color?: string;

}

export interface SearchContext {
    searchContexts: SearchContextItem[];
}

export interface SearchContextItem {
    label: string;
    value: string;
    searchContextComponent: Component;
}


export interface ListItemType {
    id: number
    label: string
}

export interface Configurable {
  configuration: any[]
  widgetConfiguration?: AnyFieldSchema[]
}

export interface notConfigurable {
}

export interface WidgetData {
    id: string | number | null
    widget: WidgetArea | null
    position: number
    pivot: number
    configuration: Record<string, any>
}



export interface MenuIcon {
    icon: string
    type: "material" | "fa"
}


export interface SuccessfullyResponse<T> {
    success: boolean
    message: string
    data: T
}


export interface ModelUpdatedData<T> {
    model: T
    connection: any
    queue: any
    afterCommit: boolean
}



type WidgetConfig = {
    size: string;
    [key: string]: string;
};

export type WidgetReference = {
    id: {
        widgetAreaId: string;
        widgetId: string;
    };
    widget: {
        id: string;
        name: string;
        allowMultiple: boolean;
    };
    position: number | null;
    configurations: WidgetConfig;
};

export type WidgetArea = {
    id: string;
    parent: string | null;
    children: string[];
    name: string;
    type: string;
    description: string | null;
    widgets: WidgetReference[];
};


export type SearchItem = {
    name: string
    description?: string
    keywords?: string[]
    type: 'page' | 'modal' | 'action'
    icon?: MenuItemIcon
    action: () => void
}

type MenuItemIcon<T extends string = string> = {
  type: T
  icon: string
  [key: string]: any
}


export {}
