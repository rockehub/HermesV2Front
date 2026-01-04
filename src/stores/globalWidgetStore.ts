import {defineStore} from "pinia";
import type {WidgetBase} from "@/helpers/extensionLoader/WidgetBase";
import {$axios} from "@/helpers/integration/integration";
import type {WidgetData} from "@/types/global";

export const useGlobalWidgetStore = defineStore('globalWidgetStore', () => {

    const fetchUsersWidget = async (widgetArea: string) => {
        let response = await $axios.get(`/widgets/${widgetArea}`)
        return response.data

    }

    const deleteWidget = async (pivotId: number, widgetArea: string) => {
        let response = await $axios.delete(`/widgets/${widgetArea}/${pivotId}/detach-widget`)
        return response.data
    }

    const addToWidgetArea = async (widgetArea: string, widget: WidgetBase, configuration: any): Promise<any> => {
        let response = await $axios.post(`/widgets/${widgetArea}`, {
            name: widget.name,
            configuration: configuration,
            allowMultiple: widget.allowMultiple,
        })
        return response.data
    }

    const updatePositions = async (widgets: WidgetData[], widgetArea: string) => {
        const sanitizedWidgets = widgets.map(({ widget, ...rest }) => rest);

        let response = await $axios.patch(`/widgets/update-positions`, {
            widgets: sanitizedWidgets
        });
    }

    return {
        fetchUsersWidget,
        addToWidgetArea,
        updatePositions,
        deleteWidget
    }

})