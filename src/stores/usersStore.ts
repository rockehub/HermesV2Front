import {defineStore} from "pinia";
import {$axios} from "@/helpers/integration/integration";


export const useUsersStore = defineStore('users', () => {

    const fetchUsers = async () => {
        let response  = await $axios.get('/users')

        return response.data;
    }

    return {
        fetchUsers
    }

})