import Modal from '../components/bootstrap/Modal.svelte';
import { createRawSnippet, mount } from 'svelte';
import { browser } from '$app/environment';
import { modalTarget, createButtons, clearModals } from './prompts';
import { attemptAsync } from 'ts-utils/check';



type Option = string | {
    value: string;
    label: string;
    disabled?: boolean;
};

type Inputs = {
    'password': {
        length: number;
    };
    'text': {
        length: number;
    };
    'number': {
        min: number;
        max: number;
        step: number;
    };
    'textarea': {
        rows: number;
    };
    'email': void;
    'checkbox': Option[];
    'radio': Option[];
    'select': Option[];
};

type ReturnTypes = {
    'text': string;
    'number': number;
    'textarea': string;
    'email': string;
    'checkbox': string[];
    'radio': string;
    'select': string;
    'password': string;
}

type InputReturnType<T extends keyof Inputs> = ReturnTypes[T];

type Input<T extends keyof Inputs> = {
    type: T;
    label: string;
    placeholder?: string;
    required: boolean;
    options?: Partial<Inputs[T]>;
    value?: string;
    disabled?: boolean;
};

export class Form<T extends { [key: string]: Input<keyof Inputs> }> {
    private eventListeners: { element: HTMLElement; type: string; listener: EventListener }[] = [];

    constructor(
        public readonly action?: string,
        public readonly method?: 'POST' | 'GET',
        public readonly inputs: T = {} as T
    ) {}

    input<Name extends string, I extends keyof Inputs>(
        name: Name,
        input: Input<I>
    ): Form<T & { [key in Name]: Input<I> }> {
        return new Form(
            this.action,
            this.method,
            {
                ...this.inputs,
                [name]: input
            }
        );
    }

    render(config?: Partial<{
        addListeners: boolean;
        submit: boolean;
    }>): HTMLFormElement {
        const form = document.createElement('form');
        const id = Math.random().toString(36).substring(7);
        form.id = id;
        form.action = this.action || '';
        form.method = this.method || '';

        for (const [name, input] of Object.entries(this.inputs)) {
            const wrapper = document.createElement('div');
            wrapper.classList.add('mb-3');

            const label = document.createElement('label');
            label.innerText = input.label;
            label.htmlFor = id + '-' + name;
            label.classList.add('form-label');

            let el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

            switch (input.type) {
                case 'text':
                case 'number':
                case 'password':
                case 'email':
                    el = document.createElement('input');
                    el.type = input.type;
                    if (input.value) el.value = input.value;
                    if (input.options) {
                        const o = input.options as Inputs['text'];
                        if (o.length) el.maxLength = o.length;
                    }
                    break;
                case 'textarea':
                    el = document.createElement('textarea');
                    el.rows = (input.options as Inputs['textarea'])?.rows || 3;
                    if (input.value) el.value = input.value;
                    break;
                case 'checkbox':
                case 'radio':
                    wrapper.classList.add('form-check');
                    for (const option of input.options as Option[]) {
                        const checkWrapper = document.createElement('div');
                        checkWrapper.classList.add('form-check');

                        const checkInput = document.createElement('input');
                        checkInput.type = input.type;
                        checkInput.name = name;
                        checkInput.checked = input.value === (typeof option === 'string' ? option : option.value);
                        checkInput.value = typeof option === 'string' ? option : option.value;
                        checkInput.classList.add('form-check-input');

                        const checkLabel = document.createElement('label');
                        checkLabel.innerText = typeof option === 'string' ? option : option.label;
                        checkLabel.classList.add('form-check-label');

                        checkWrapper.appendChild(checkInput);
                        checkWrapper.appendChild(checkLabel);
                        wrapper.appendChild(checkWrapper);
                    }
                    form.appendChild(wrapper);
                    continue;
                case 'select':
                    el = document.createElement('select');
                    for (const option of input.options as Option[]) {
                        const opt = document.createElement('option');
                        opt.value = typeof option === 'string' ? option : option.value;
                        opt.innerText = typeof option === 'string' ? option : option.label;
                        if (typeof option !== 'string' && option.disabled) {
                            opt.disabled = true;
                        }
                        if (input.value) el.value = input.value;
                        el.appendChild(opt);
                    }
                    break;
                default:
                    throw new Error(`Unsupported input type: ${input.type}`);
            }

            el.name = name;
            el.id = id + '-' + name;
            el.classList.add('form-control', `input-${id}-${name}`);

            if (input.placeholder) {
                if (el instanceof HTMLSelectElement) {
                    const placeholderOption = document.createElement('option');
                    placeholderOption.value = '';
                    placeholderOption.disabled = true;
                    placeholderOption.selected = true;
                    placeholderOption.innerText = input.placeholder;
                    el.appendChild(placeholderOption);
                } else {
                    el.placeholder = input.placeholder;
                }
            }

            if (input.required) {
                el.required = true;
            }

            if (config?.addListeners) {
                const onChange = (e: Event) => {
                    if (input.type === 'checkbox') {
                        const checkbox = e.target as HTMLInputElement;
                        if (checkbox.checked) {
                            el.value = checkbox.value;
                        }
                    } else if (input.type === 'radio') {
                        const radio = e.target as HTMLInputElement;
                        if (radio.checked) {
                            el.value = radio.value;
                        }
                    } else {
                        el.value = (e.target as HTMLInputElement).value;
                    }
                };
    
                el.addEventListener('change', onChange);
                this.eventListeners.push({ element: el, type: 'change', listener: onChange });
            }

            if (input.disabled) {
                el.disabled = true;
            }

            wrapper.appendChild(label);
            wrapper.appendChild(el);
            form.appendChild(wrapper);
        }

        if (config?.submit) {
            const submit = document.createElement('button');
            submit.type = 'submit';
            submit.innerText = 'Submit';
            submit.classList.add('btn', 'btn-primary');
            form.appendChild(submit);
        }
        return form;
    }

    destroy() {
        this.eventListeners.forEach(({ element, type, listener }) => {
            element.removeEventListener(type, listener);
        });
        this.eventListeners = [];
    }

    value(): {
        [key in keyof T]: InputReturnType<T[key]['type']>;
    } {
        const values: Record<string, string | string[]> = {};

        for (const [name, input] of Object.entries(this.inputs)) {
            const elements = document.querySelectorAll(`[name="${name}"]`);

            if (input.type === 'checkbox' || input.type === 'radio') {
                const selectedValues: string[] = [];
                elements.forEach(el => {
                    const inputEl = el as HTMLInputElement;
                    if (inputEl.checked) {
                        selectedValues.push(inputEl.value);
                    }
                });
                values[name] = selectedValues;
            } else {
                const inputEl = elements[0] as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
                values[name] = inputEl.value;
            }
        }

        return values as {
            [key in keyof T]: InputReturnType<T[key]['type']>;
        };
    }

    submit() {
        const form = this.render({
            addListeners: false,
        });
        form.submit();
    }

    prompt(title: string) {
        const self = this;
        return attemptAsync(async () => {
            clearModals();
            return new Promise<{ [key in keyof T]: InputReturnType<T[key]['type']> }>((res, rej) => {
                if (!modalTarget) return rej('Modal target not found, likely not in the DOM environment');
                const modal = mount(Modal, {
                    target: modalTarget,
                    props: {
                        title,
                        body: createRawSnippet(() => ({
                            render() {
                                const div = document.createElement('div');
                                div.appendChild(self.render({
                                    addListeners: true,
                                    submit: false
                                }));
                                return div.innerHTML;
                            },
                            setup(el: Element)   {
                                if (!(el instanceof HTMLFormElement)) return console.error('Element is not a form, there may be an issue with the setup and some things may not work as intended');
                                const id = el.id;
                                if (!id) return console.error('Form does not have an ID, there may be an issue with the setup and some things may not work as intended');
                                el.querySelectorAll(`.input-${id}`).forEach(i => {
                                    const onchange = (e: Event) => {
                                        const input = e.target as HTMLInputElement;
                                        if (input.type === 'checkbox') {
                                            const checkbox = e.target as HTMLInputElement;
                                            if (checkbox.checked) {
                                                input.value = checkbox.value;
                                            }
                                        } else if (input.type === 'radio') {
                                            const radio = e.target as HTMLInputElement;
                                            if (radio.checked) {
                                                input.value = radio.value;
                                            }
                                        } else {
                                            input.value = (e.target as HTMLInputElement).value;
                                        }
                                    }

                                    i.addEventListener('change', onchange);
                                    self.eventListeners.push({ element: i as HTMLElement, type: 'change', listener: onchange });
                                });

                                const submit = (e: Event) => {
                                    e.preventDefault();
                                    res(self.value());
                                    modal.hide();
                                };

                                el.addEventListener('submit', submit);
                                self.eventListeners.push({ element: el, type: 'submit', listener: submit });
                                return () => self.destroy();
                            }
                        })),
                        buttons: createButtons([
                            {
                                text: 'Submit',
                                color: 'primary',
                                onClick: () => {
                                    res(self.value());
                                    modal.hide();
                                },
                            },
                            {
                                text: 'Cancel',
                                color: 'secondary',
                                onClick: () => {
                                    rej('cancel');
                                    modal.hide();
                                },
                            }
                        ]),
                    }
                });

                modal.show();
                modal.once('hide', () => {
                    self.destroy();
                    rej('cancel');
                    clearModals();
                });
            });
        });
    }
}


// // Usage
// const f = new Form()
//     .input('name', {
//         type: 'text',
//         required: true,
//         label: 'Name',
//         placeholder: 'Enter your name'
//     })
//     .input('age', {
//         type: 'number',
//         required: true,
//         label: 'Age',
//         options: { min: 18, max: 100, step: 1 }
//     })
//     .input('gender', {
//         type: 'radio',
//         required: true,
//         label: 'Gender',
//         options: ['Male', 'Female', 'Other']
//     })
//     .input('preferences', {
//         type: 'checkbox',
//         required: false,
//         label: 'Preferences',
//         options: [
//             { value: 'sports', label: 'Sports' },
//             { value: 'music', label: 'Music' },
//             { value: 'tech', label: 'Technology' }
//         ]
//     })
//     .prompt('Enter your details...');

// // document.body.appendChild(f.render());
// // console.log(f.value());
