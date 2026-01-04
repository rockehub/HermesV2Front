import {type RemovableRef} from "@vueuse/core";

export interface DataManagementState {
    availableDataManagement: DataManagement[] | RemovableRef<DataManagement[]>
    loading: boolean
    metaData: any
    listData: DataManagementListData | RemovableRef<DataManagementListData> | null
    listMetaData: any
}

export interface DataManagement {
    name: string
    provider: string
}

export interface DataManagementListData {
    data: Data
    preferences: Preferences
}

export interface Preferences {
    available: []
    chosen: {}
}


export interface Data {
    current_page: number
    data: any[]
    first_page_url: string
    from: number
    last_page: number
    last_page_url: string
    links: Link[]
    next_page_url: any
    path: string
    per_page: number
    prev_page_url: any
    to: number
    total: number
}


export interface Link {
    url?: string
    label: string
    active: boolean
}




export interface ListItemType {
    id: number
    label: string
}


export interface Media {
    id: number
    model_type: string
    model_id: number
    uuid: string
    collection_name: string
    name: string
    file_name: string
    mime_type: string
    disk: string
    conversions_disk: string
    size: number
    manipulations: any[]
    custom_properties: any[]
    generated_conversions: GeneratedConversions
    responsive_images: any[]
    order_column: number
    created_at: string
    updated_at: string
    original_url: string
    preview_url: string
}

export interface GeneratedConversions {
    preview: boolean
}
