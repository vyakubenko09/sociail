import $ from "jquery";

import * as pm_list from "./pm_list";
import * as popovers from "./popovers";
import * as stream_list from "./stream_list";
import * as topic_list from "./topic_list";

let pending_stream_list_rerender = false;
let zoomed_in = false;

export function is_zoomed_in() {
    return zoomed_in;
}

function zoom_in() {
    const stream_id = topic_list.active_stream_id();

    popovers.hide_all_except_sidebars();
    pm_list.close();
    topic_list.zoom_in();
    stream_list.zoom_in_topics({
        stream_id,
    });

    zoomed_in = true;
}

export function set_pending_stream_list_rerender(value) {
    pending_stream_list_rerender = value;
}

export function zoom_out() {
    if (pending_stream_list_rerender) {
        stream_list.update_streams_sidebar(true);
    }
    const $stream_li = topic_list.get_stream_li();

    popovers.hide_all_except_sidebars();
    topic_list.zoom_out();
    stream_list.zoom_out_topics();

    if ($stream_li) {
        stream_list.scroll_stream_into_view($stream_li);
    }

    zoomed_in = false;
}

export function clear_topics() {
    const $stream_li = topic_list.get_stream_li();

    topic_list.close();

    if (zoomed_in) {
        stream_list.zoom_out_topics();

        if ($stream_li) {
            stream_list.scroll_stream_into_view($stream_li);
        }
    }

    zoomed_in = false;
}

export function initialize() {
    $("#stream_filters").on("click", ".show-more-topics", (e) => {
        zoom_in();

        e.preventDefault();
        e.stopPropagation();
    });

    $(".show-all-streams").on("click", (e) => {
        zoom_out();

        e.preventDefault();
        e.stopPropagation();
    });
}
