import { WidgetBase } from '@/helpers/extensionLoader/WidgetBase';
import type { Component } from 'vue';
import type { StorefrontPageType } from '../composables/useStorefrontApi';

export type StorefrontWidgetFieldType = 'text' | 'textarea' | 'number' | 'boolean' | 'select';

export interface StorefrontWidgetFieldOption {
  label: string;
  value: string;
}

export interface StorefrontWidgetField {
  id: string;
  label: string;
  type: StorefrontWidgetFieldType;
  description?: string;
  defaultValue?: any;
  options?: StorefrontWidgetFieldOption[];
  section?: 'content' | 'layout' | 'style';
}

export interface StorefrontWidgetDefinition {
  name: string;
  title: string;
  description: string;
  category: string;
  icon?: string;
  allowMultiple?: boolean;
  supportedPageTypes: StorefrontPageType[];
  component: Component;
  fields?: StorefrontWidgetField[];
}

export function setByPath(target: Record<string, any>, path: string, value: any) {
  const segments = path.split('.').filter(Boolean);
  if (!segments.length) {
    return target;
  }

  let current: Record<string, any> = target;
  segments.forEach((segment, index) => {
    if (index === segments.length - 1) {
      current[segment] = value;
      return;
    }

    if (!current[segment] || typeof current[segment] !== 'object' || Array.isArray(current[segment])) {
      current[segment] = {};
    }

    current = current[segment];
  });

  return target;
}

export function getByPath(source: Record<string, any> | undefined, path: string) {
  return path.split('.').filter(Boolean).reduce<any>((acc, segment) => {
    if (acc == null) {
      return undefined;
    }
    return acc[segment];
  }, source);
}

export default class StorefrontWidgetBase extends WidgetBase {
  title = '';
  description = '';
  category = 'General';
  icon = 'dashboard_customize';
  allowMultiple = true;
  supportedPageTypes: StorefrontPageType[] = [];
  fields: StorefrontWidgetField[] = [];
  component: Component;
  name: string;

  constructor(definition: StorefrontWidgetDefinition) {
    super();
    this.name = definition.name;
    this.title = definition.title;
    this.description = definition.description;
    this.category = definition.category;
    this.icon = definition.icon || this.icon;
    this.allowMultiple = definition.allowMultiple ?? true;
    this.supportedPageTypes = definition.supportedPageTypes;
    this.component = definition.component;
    this.fields = definition.fields || [];
  }

  supportsPageType(pageType: StorefrontPageType) {
    return this.supportedPageTypes.includes(pageType);
  }

  buildDefaultConfiguration() {
    return this.fields.reduce<Record<string, any>>((acc, field) => {
      if (field.defaultValue !== undefined) {
        setByPath(acc, field.id, field.defaultValue);
      }
      return acc;
    }, {});
  }
}
