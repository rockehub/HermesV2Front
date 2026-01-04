import { defineStore} from 'pinia';

interface FormGeneratorStoreState {
    forms: any[];
}


export const useFormGeneratorStore = defineStore('formGenerator', {
    state: () => ({
        forms: [] as any[]
    }),
    actions: {
        registerForm(formGeneratorInstance: any) {
            this.forms.push(formGeneratorInstance);
        },
        unregisterForm(formGeneratorInstance: any) {
            const index = this.forms.indexOf(formGeneratorInstance);
            if (index > -1) {
                this.forms.splice(index, 1);
            }
        }
    }
});