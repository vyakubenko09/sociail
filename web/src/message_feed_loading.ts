import $ from "jquery";

import * as loading from "./loading";

let loading_older_messages_indicator_showing = false;
let loading_newer_messages_indicator_showing = false;

export function show_loading_older(): void {
    if (!loading_older_messages_indicator_showing) {
        loading.make_indicator($("#loading_older_messages_indicator"), {abs_positioned: true});
        loading_older_messages_indicator_showing = true;
    }
}

export function hide_loading_older(): void {
    if (loading_older_messages_indicator_showing) {
        loading.destroy_indicator($("#loading_older_messages_indicator"));
        loading_older_messages_indicator_showing = false;
    }
}

export function show_loading_newer(): void {
    if (!loading_newer_messages_indicator_showing) {
        $(".bottom-messages-logo").show();
        loading.make_indicator($("#loading_newer_messages_indicator"), {abs_positioned: true});
        loading_newer_messages_indicator_showing = true;
    }
}

export function hide_loading_newer(): void {
    if (loading_newer_messages_indicator_showing) {
        $(".bottom-messages-logo").hide();
        loading.destroy_indicator($("#loading_newer_messages_indicator"));
        loading_newer_messages_indicator_showing = false;
    }
}

export function hide_indicators(): void {
    hide_loading_older();
    hide_loading_newer();
}
