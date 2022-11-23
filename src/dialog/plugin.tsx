import Vue from 'vue';
import { InjectionKey, ComponentInstance } from '@vue/composition-api';
import DialogComponent from './dialog';

import { getAttach } from '../utils/dom';
import {
  DialogOptions, DialogMethod, DialogConfirmMethod, DialogAlertMethod, DialogInstance,
} from './type';

function resolveInject(provideKey: InjectionKey<any> | string, vm: ComponentInstance): any {
  let source = vm;
  while (source) {
    // @ts-ignore
    if (source._provided && Object.hasOwnProperty.call(source._provided, provideKey)) {
      // @ts-ignore
      return source._provided[provideKey];
    }
    source = source.$parent;
  }

  return {};
}

const createDialog: DialogMethod = function (props: DialogOptions) {
  const options = { ...props };

  // @ts-ignore
  const global = resolveInject('globalConfig', this);
  const dialogConfig = global.dialog || {};

  const dialog = new DialogComponent({
    propsData: {
      ...options,
      ...dialogConfig,
      onClose:
        options.onClose
        || (() => {
          dialog.visible = false;
        }),
    },
  }).$mount();
  dialog.visible = true;
  if (options.className) {
    options.className.split(' ').forEach((name) => {
      dialog.$el.classList.add(name.trim());
    });
  }
  if (options.style) {
    (dialog.$el as HTMLElement).style.cssText += options.style;
  }
  const container = getAttach(options.attach);
  if (container) {
    container.appendChild(dialog.$el);
  } else {
    console.error('attach is not exist');
  }

  const dialogNode: DialogInstance = {
    show: () => {
      dialog.visible = true;
    },
    hide: () => {
      dialog.visible = false;
    },
    update: (options: DialogOptions) => {
      Object.assign(dialog, options);
    },
    destroy: () => {
      dialog.visible = false;
      container.contains(dialog.$el) && container.removeChild(dialog.$el);
    },
  };
  return dialogNode;
};
interface ExtraApi {
  confirm: DialogConfirmMethod;
  alert: DialogAlertMethod;
}

const confirm: DialogConfirmMethod = (props: DialogOptions) => createDialog(props);

const alert: DialogAlertMethod = (props: Omit<DialogOptions, 'confirmBtn'>) => {
  const options = { ...props };
  options.cancelBtn = null;
  return createDialog(options);
};

const extraApi: ExtraApi = {
  confirm,
  alert,
};

const _DialogPlugin: Vue.PluginObject<undefined> = {
  install: () => {
    Vue.prototype.$dialog = createDialog;
    Object.keys(extraApi).forEach((funcName) => {
      Vue.prototype.$dialog[funcName] = extraApi[funcName];
    });
  },
};

Object.keys(extraApi).forEach((funcName) => {
  _DialogPlugin[funcName] = extraApi[funcName];
});

export const DialogPlugin: Vue.PluginObject<undefined> & DialogMethod & ExtraApi = _DialogPlugin as any;
export default DialogPlugin;

declare module 'vue/types/vue' {
  // Bind to `this` keyword
  interface Vue {
    $dialog: DialogMethod & ExtraApi;
  }
}
