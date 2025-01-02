<script lang="ts">
	import type { BootstrapColor } from "colors/color";
	import { onMount, type Snippet } from "svelte";

    interface Props {
        title: string;
        message: string;
        color: BootstrapColor;
        autoHide: number; // ms
        icon?: Snippet; // svg
    }

    const { title, message, color, autoHide = 5000, icon }: Props = $props();

    const start = Date.now();
    let time = $state('Just now');
    const interval = setInterval(() => {
        switch (true) {
            case Date.now() - start < 1000:
                time = 'Just now';
                break;
            case Date.now() - start < 1000 * 60:
                time = `${Math.floor((Date.now() - start) / 1000)} seconds ago`;
                break;
            case Date.now() - start < 1000 * 60 * 60:
                time = `${Math.floor((Date.now() - start) / 1000 / 60)} minutes ago`;
                break;
            case Date.now() - start < 1000 * 60 * 60 * 24:
                time = `${Math.floor((Date.now() - start) / 1000 / 60 / 60)} hours ago`;
                break;
            default:
                time = `${Math.floor((Date.now() - start) / 1000 / 60 / 60 / 24)} days ago`;
                break;
        }
        if (autoHide > 0 && Date.now() - start > autoHide) {
            hide();
        }
    }, 1000 * 30);

    onMount(() => destroy);

    export const destroy = () => {
        clearInterval(interval);
    };

    let doShow = $state(true);

    export const hide = () => {
        doShow = false;
    };
    export const show = () => {
        doShow = true;
    };

    let textColor = $state('white');
    switch (color) {
        case 'primary':
        case 'secondary':
        case 'success':
        case 'danger':
        case 'warning':
        case 'info':
        case 'light':
        case 'dark':
            textColor = 'white';
            break;
        default:
            textColor = 'dark';
            break;
    }
</script>

<div
    class="alert alert-{color} alert-dismissible fade"
    role="alert"
    class:show={doShow}
    aria-atomic="true"
    aria-live="assertive"
>
    <button
        type="button"
        class="btn-close"
        aria-label="Close"
        onclick={hide}
    ></button>
    {@html icon}
    <div class="d-flex justify-content-between">
        <h5 class="alert-heading">{title}</h5>
        <small>{time}</small>
    </div>
    <hr>
    <p>{message}</p>
</div>