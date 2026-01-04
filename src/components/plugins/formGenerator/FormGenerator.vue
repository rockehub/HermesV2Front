<template>
  <Form @submit="handleSubmit" ref="masterForm">
    <slot name="header">

    </slot>
    <slot>
      <div class="col-span-12 lg:col-span-8">
        <div class="card">
          <slot class="form-group row" name="submit">
            <div
                class="flex flex-col items-center space-y-4 border-b border-slate-200 p-4 dark:border-navy-500 sm:flex-row sm:justify-between sm:space-y-0 sm:px-5">
              <h2 class="text-lg font-medium tracking-wide text-slate-700 dark:text-navy-100">
                {{ formName }}
              </h2>
              <div class="flex justify-center space-x-2">
                <button v-if="cancelButton" type="button"
                        class="btn min-w-[7rem] rounded-full border border-slate-300 font-medium text-slate-700 hover:bg-slate-150 focus:bg-slate-150 active:bg-slate-150/80 dark:border-navy-450 dark:text-navy-100 dark:hover:bg-navy-500 dark:focus:bg-navy-500 dark:active:bg-navy-500/90">
                  {{ $t('app.cancel') }}
                </button>
                <button
                    class="btn min-w-[7rem] rounded-full bg-primary font-medium text-white hover:bg-primary-focus focus:bg-primary-focus active:bg-primary-focus/90 dark:bg-accent dark:hover:bg-accent-focus dark:focus:bg-accent-focus dark:active:bg-accent/90"
                    type="submit" v-if="!noButton"> {{ $t('button') }}
                </button>
              </div>
            </div>
          </slot>

          <div class="p-4 sm:p-5">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-12" v-if="!loading">
              <div v-for="field in filteredFormSchema" :key="field.name" class="mb-3 "
                   :class="getFieldLabelClass(field) ">
                <div v-if="!field.dependsOn || (form[field.dependsOn] && (!field.condition || ConditionChecker.executeConditions([field.condition], form).every(condition => condition)))">
                  <label :for="field.name">{{
                      t(`${translateTag}.${provider}.form.${slug(field.label)}`.toLowerCase())
                    }}
                    <span class="text-danger"
                          v-if="isRequired(field)">*</span></label>
                  <template v-if="field.type == 'selectList'">
                    <VueMultiselect :id="field.name" :name="field.name" v-model="form[field.name]"
                                    :multiple="field.multi"
                                    :options="getOptions(field.options)"
                                    :disabled="field.disabled" label="name" track-by="name" :preselect-first="true">

                    </VueMultiselect>
                  </template>
                  <template v-else-if="field.type === 'list'">
                    <ListType :scopes="field.scopes" :headers="field.headers" :get-items-url="field.urls.get"
                              :update-items-url="field.urls.update" :remove-items-url="field.urls.remove"/>
                  </template>
                  <template v-else-if="field.type === 'fileupload'">
                    <FIleUpload :upload-url="field.url" :mode="field.mode" :field="field" :id="id"
                                :initial-values="initialValues" :provider="this.provider"/>
                  </template>
                  <template v-else-if="field.type === 'recordFinder'">
                    <RecordFinder :initial-value="initialValues[field.name]" :field="field"
                                  @record-selected="setFormValue"></RecordFinder>
                  </template>
                  <template v-else-if="field.type === 'dropdown'">
                    <DropdownSelect :dependsOnValue="form[field.dependsOn]" v-model="form[field.name]"
                                    :value="form[field.name]"
                                    v-if="!(field.dependsOn) || form[field.dependsOn]"
                                    :params="field.async && field.async.params"
                                    :options="field?.options"
                                    :async-url="field.async && field.async.url"></DropdownSelect>
                    <select v-else disabled
                            class="form-select w-full rounded-lg border  bg-transparent px-3 py-2 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:bg-navy-700 dark:hover:border-navy-400 dark:focus:border-accent">
                      <option value="" disabled selected> {{ $t('app.selectFirst') }}
                      </option>
                    </select>
                  </template>
                  <template v-else-if="field.type === 'searchlist'">
                    <label class="block">
                      <SearchList :initial-value="initialValues[field.name]" :field="field" :url="field.async.url"
                                  v-model="form[field.name]"
                                  :params="field.async.params"
                                  @record-selected="setFormValue"></SearchList>
                    </label>
                  </template>
                  <template v-else-if="field.type === 'checkbox'">
                    <Field v-model="form[field.name]" :name="field.name" :label="field.label" :rules="fieldRules(field)"
                           @blur="actionBlur(field)">
                      <template #default="{ field: veeField,errors, valid, }">
                        <label class="inline-flex items-center space-x-2">
                          <input
                              class="form-checkbox is-basic h-5 w-5 rounded border-slate-400/70 checked:bg-primary checked:border-primary hover:border-primary focus:border-primary dark:border-navy-400 dark:checked:bg-accent dark:checked:border-accent dark:hover:border-accent dark:focus:border-accent"
                              v-bind="veeField"
                              :type="field.type"
                              :id="field.name"
                              :class="{'border-error': errors[0],'border-success':valid }"
                              :checked="field.checked"
                          />
                          <span>Primary</span>
                        </label>
                      </template>
                    </Field>
                  </template>
                  <template v-else-if="field.mask">
                    <Field v-if="field.mask" :name="field.name" :rules="fieldRules(field)" @blur="actionBlur(field)"
                           v-model="form[field.name]">
                      <template #default="{ field: veeField,errors, valid,}">
                        <label class="block">
                          <input
                              v-maska="{ 0: { pattern: /[0-9]/, optional: true }}"
                              :data-maska="field.mask"
                              v-bind="veeField"
                              :type="field.type"
                              :id="field.name"
                              class="form-input w-full rounded-lg border bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:bg-navy-700 dark:hover:border-navy-400 dark:focus:border-accent"
                              :class="{'border-error': errors[0],'border-success':valid,'form-check-input': field.type === 'checkbox'}"
                              :checked="field.checked"
                              :disabled="field.disabled">

                        </label>
                      </template>
                    </Field>
                  </template>
                  <template v-else>
                    <Field v-model="form[field.name]" :name="field.name" :label="field.label" :rules="fieldRules(field)"
                           @blur="actionBlur(field)">
                      <template #default="{ field: veeField,errors, valid, }">

                        <label class="block">
                          <input
                              class="form-input w-full rounded-lg border  bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:bg-navy-700 dark:hover:border-navy-400 dark:focus:border-accent"
                              v-bind="veeField"
                              :type="field.type"
                              :id="field.name"
                              :checked="field.checked"
                              :class="{'border-error': errors[0],'border-success':valid,'form-check-input': field.type === 'checkbox' }"
                              :disabled="field.disabled"
                          />
                        </label>

                      </template>
                    </Field>
                  </template>
                  <small v-if="field.comment" class="form-text text-muted d-block">{{ field.comment }}</small>
                  <ErrorMessage :name="field.name" class="text-tiny+ text-error"></ErrorMessage>

                </div>
              </div>
            </div>
            <GeneralSpinner v-else/>

          </div>
        </div>
      </div>
    </slot>
  </Form>
</template>
<script lang="ts" setup>
import VueMultiselect from 'vue-multiselect'
import {ErrorMessage, Field, Form} from 'vee-validate'
import ListType from "./fields/ListType.vue";
import FIleUpload from "./fields/FIleUpload.vue";
import RecordFinder from "./fields/RecordFinder.vue";
import {useFormGeneratorStore} from "./store/formGeneratorStore";
import {vMaska} from "maska/vue";

import DropdownSelect from "./fields/DropdownSelect.vue";
import {useLocalizationStore} from "@/stores/localizationStore";
import {computed, onBeforeMount, onMounted, ref} from "vue";

import {all} from '@vee-validate/rules';
import SearchList from "./fields/SearchList.vue";
import GeneralSpinner from "@/components/generic/GeneralSpinner.vue";
import {useI18n} from "vue-i18n";
import CheckBox from "@/components/plugins/formGenerator/fields/CheckBox.vue";
import DefaultField from "@/components/plugins/formGenerator/fields/DefaultField.vue";
import {ConditionChecker} from "@/components/plugins/formGenerator/uitls/ConditionChecker";


export interface FormSchemaField {
  name: string | number
  scopes?: string | string[]
  span?: 'full' | 'left' | 'right' | 'left-2' | 'right-2' | 'left-3' | 'right-3' | `span-${number}`;
  hidden?: boolean;
  dependsOn?: string;
  type: string;
  imageWidth?: number;
  imageHeight?: number;
  provider?: string;
  list?: any
}

const {t} = useI18n()
const emit = defineEmits(['onSubmit'])

interface MyComponentProps {
  translateTag?: string;
  provider?: string;
  loading?: boolean;
  cancelButton?: boolean;
  formName?: string;
  scope?: string;
  formSchema: object;
  textButton?: string;
  noButton?: boolean;
  initialValues?: any;
  id?: string;
  useStore?: boolean;
}

const props = defineProps<MyComponentProps>();

const defaultProps: Partial<MyComponentProps> = {
  translateTag: 'data',
  provider: '',
  loading: false,
  cancelButton: false,
  formName: 'app.form',
  scope: 'create',
  formSchema: {},
  textButton: 'app.submit',
  noButton: false,
  initialValues: {},
  useStore: false,
};

Object.keys(defaultProps).forEach((key) => {
  if (!(key in props)) {
    (props as any)[key] = (defaultProps as any)[key];
  }
});

if (props.scope === 'update' && !props.id) {
  console.error('If `isSpecial` is `true`, `requiredProp` is required.');
}

let formId = ref('')
let form = ref({})
let oldValues = ref([])

let masterForm = ref(null)


onMounted(() => {
  if (props.initialValues) {
    form.value = props.initialValues
    oldValues.value = JSON.parse(JSON.stringify(props.initialValues));
  }

  formId.value = Math.random().toString(36).substring(7);

  if (props.useStore) {
    const store = useFormGeneratorStore();
    store.registerForm(this);
  }
})

onBeforeMount(() => {
  if (props.useStore) {
    const store = useFormGeneratorStore();
    store.unregisterForm(this);
  }
})

const filteredFormSchema = computed(() => {
  return props.formSchema.filter((field: FormSchemaField) => {
    if (field.scopes) {
      let scopes: string = field.scopes as string
      return scopes === this.scope
    }
    return true
  })
})


const slug = (text: string) => {
  return text.replace(/ /g, '_').toLowerCase()
};
const actionBlur = (field: { blur: () => void; }) => {
  if (field.blur && typeof field.blur === 'function') {
    field.blur()
  }
};
const getOptions = (options: () => any) => {
  if (typeof options === 'function') {
    return options()
  }
  return options
};
const setFormValue = (value: any, field: string) => {
  this.form[field] = value
};
const isRequired = (field: { rules: string | string[]; }) => {
  return field.rules ? Object.values(field.rules).includes('required') : false
};
const fieldRules = (field: { rules: any[] }) => {
  const filteredRules: Record<string, any> = {};

  if (field.rules) {
    field.rules.forEach((rule) => {
      if (typeof rule === "string") {
        // If rule is a string, check if it exists in vee-validate
        if (all[rule]) {
          filteredRules[rule] = true; // Set the rule as `true` to indicate it's enabled
        }
      } else if (typeof rule === "object" && rule !== null) {
        // If rule is an object, extract its key and value
        const [ruleName, ruleValue] = Object.entries(rule)[0];
        if (all[ruleName]) {
          filteredRules[ruleName] = ruleValue;
        }
      }
    });
  }

  return Object.keys(filteredRules).length > 0 ? filteredRules : '';
};

const handleSubmit = async () => {
  let result = await (masterForm.value).validate()
  if (result.valid) {
    let formData = {} as any
    props.formSchema.forEach((field: any) => {
      if (form.value[field.name]) {
        formData[field.name] = form.value[field.name]
      }
    })
    emit('onSubmit', form.value)
  }
};
const getFieldLabelClass = (field: FormSchemaField): string[] => {
  const classMap: { [key: string]: string } = {
    full: 'block sm:col-span-12',
    left: 'block sm:col-span-6',
    right: 'block sm:col-span-6 sm:col-start-7',
    'left-2': 'block sm:col-span-4',
    'right-2': 'block sm:col-span-4 sm:col-start-5',
    'left-3': 'block sm:col-span-3',
    'right-3': 'block sm:col-span-3 sm:col-start-4',
  };

  for (let i = 1; i <= 12; i++) {
    classMap[`span-${i}`] = `block sm:col-span-${i}`;
  }

  const classes = ['block'];

  if (field.span) {
    classes.push(classMap[field.span] || 'block sm:col-span-12');
  }

  if (field.hidden) {
    classes.push('hidden');
  }

  return classes;
};


</script>

<style scoped lang="scss">

.span-full {
  width: 100%;
  float: left;
}

.span-left {
  float: left;
  width: 50%;
  clear: left;
}

.span-right {
  float: right;
  width: 50%;
  clear: right;
}

.clear-full {
  clear: both;
}

.clear-left {
  clear: left;
}

.clear-right {
  clear: right;
}

</style>