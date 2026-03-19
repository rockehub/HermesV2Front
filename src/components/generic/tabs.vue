<template>
    <div>
        <perfect-scrollbar  class="tabs-container">
            <ul class="flex flex-nowrap">
                <li v-for="tab in tabItems" :key="tab.name">
                    <a
                        href="javascript:;"
                        class="p-7 py-3 flex items-center bg-[#f6f7f8] dark:bg-transparent border-transparent border-t-2 dark:hover:bg-[#191e3a] hover:border-secondary hover:text-secondary"
                        :class="{ '!border-secondary text-secondary dark:bg-[#191e3a]': activeTab === tab.name }"
                        @click="setActiveTab(tab.name)"
                    >
                        <slot name="icon" :name="tab.name" :label="tab.label">
                            {{ tab.label }}
                        </slot>
                    </a>
                </li>
            </ul>
        </perfect-scrollbar>

        <!-- Tabs Content -->
        <div class="flex-1 text-sm">
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
    import { provide, ref, onMounted } from "vue";
    import { PerfectScrollbar } from 'vue3-perfect-scrollbar'

    const props = defineProps({
        defaultTab: {
            type: String,
            default: "",
        },
    });

    const activeTab = ref<string | null>(null);
    const tabItems = ref<{ name: string; label: string }[]>([]);

    const setActiveTab = (name: string) => {
        if (tabItems.value.some(tab => tab.name === name)) {
            activeTab.value = name;
            localStorage.setItem("activeTab", name);
        }
    };

    const goTo = (tabName: string) => {
        setActiveTab(tabName);
    };

    // Check local storage for saved active tab on mounted
    onMounted(() => {
        const savedTab = localStorage.getItem("activeTab");
        if (savedTab && tabItems.value.some(tab => tab.name === savedTab)) {
            activeTab.value = savedTab;
        } else if (props.defaultTab) {
            activeTab.value = props.defaultTab;
        } else if (tabItems.value.length > 0) {
            activeTab.value = tabItems.value[0].name;
        }
    });


    provide("activeTab", activeTab);
    provide("registerTab", (tab: { name: string; label: string }) => {
        tabItems.value.push(tab);
    });

    provide("unregisterTab", (tabName: string | undefined) => {
        if (!tabName) return;
        tabItems.value = tabItems.value.filter(tab => tab.name !== tabName);
    });
    defineExpose({
      goTo: goTo,
    })
</script>


<style scoped>
    .tabs-container {
        overflow-x: auto;
        white-space: nowrap;
        width: 100%; /* ou uma largura específica */
    }
</style>
