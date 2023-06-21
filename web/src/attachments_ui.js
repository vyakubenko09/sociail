import $ from "jquery";

import render_confirm_delete_attachment from "../templates/confirm_dialog/confirm_delete_attachment.hbs";
import render_settings_upload_space_stats from "../templates/settings/upload_space_stats.hbs";
import render_uploaded_files_list from "../templates/settings/uploaded_files_list.hbs";

import * as channel from "./channel";
import * as dialog_widget from "./dialog_widget";
import {$t, $t_html} from "./i18n";
import * as ListWidget from "./list_widget";
import * as loading from "./loading";
import {page_params} from "./page_params";
import * as scroll_util from "./scroll_util";
import * as timerender from "./timerender";
import * as ui_report from "./ui_report";

let attachments;
let upload_space_used;

export function bytes_to_size(bytes, kb_with_1024_bytes = false) {
    const kb_size = kb_with_1024_bytes ? 1024 : 1000;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    if (bytes === 0) {
        return "0 B";
    }
    const i = Number.parseInt(Math.floor(Math.log(bytes) / Math.log(kb_size)), 10);
    let size = Math.round(bytes / Math.pow(kb_size, i));
    if (i > 0 && size < 10) {
        size = Math.round((bytes / Math.pow(kb_size, i)) * 10) / 10;
    }
    return size + " " + sizes[i];
}

export function percentage_used_space(uploads_size) {
    if (page_params.realm_upload_quota_mib === null) {
        return null;
    }
    return ((100 * uploads_size) / page_params.realm_upload_quota_mib).toFixed(1);
}

function set_upload_space_stats() {
    if (page_params.realm_upload_quota_mib === null) {
        return;
    }
    const args = {
        show_upgrade_message: page_params.realm_plan_type === 2,
        percent_used: percentage_used_space(upload_space_used),
        upload_quota: bytes_to_size(page_params.realm_upload_quota_mib, true),
    };
    const rendered_upload_stats_html = render_settings_upload_space_stats(args);
    $("#attachment-stats-holder").html(rendered_upload_stats_html);
}

function delete_attachments(attachment, file_name) {
    const html_body = render_confirm_delete_attachment({file_name});

    dialog_widget.launch({
        html_heading: $t_html({defaultMessage: "Delete file?"}),
        html_body,
        html_submit_button: $t_html({defaultMessage: "Delete"}),
        id: "confirm_delete_file_modal",
        focus_submit_on_open: true,
        on_click: () =>
            dialog_widget.submit_api_request(channel.del, "/json/attachments/" + attachment),
        loading_spinner: true,
    });
}

function sort_mentioned_in(a, b) {
    const a_m = a.messages[0];
    const b_m = b.messages[0];

    if (!a_m) {
        return 1;
    }
    if (!b_m) {
        return -1;
    }

    if (a_m.id > b_m.id) {
        return 1;
    } else if (a_m.id === b_m.id) {
        return 0;
    }

    return -1;
}

function render_attachments_ui() {
    set_upload_space_stats();

    const $uploaded_files_table = $("#uploaded_files_table").expectOne();
    const $search_input = $("#upload_file_search");

    ListWidget.create($uploaded_files_table, attachments, {
        name: "uploaded-files-list",
        modifier(attachment) {
            return render_uploaded_files_list({attachment});
        },
        filter: {
            $element: $search_input,
            predicate(item, value) {
                return item.name.toLocaleLowerCase().includes(value);
            },
            onupdate() {
                scroll_util.reset_scrollbar(
                    $uploaded_files_table.closest(".progressive-table-wrapper"),
                );
            },
        },
        $parent_container: $("#attachments-settings").expectOne(),
        init_sort: ["numeric", "create_time"],
        initially_descending_sort: true,
        sort_fields: {
            mentioned_in: sort_mentioned_in,
        },
        $simplebar_container: $("#attachments-settings .progressive-table-wrapper"),
    });

    scroll_util.reset_scrollbar($uploaded_files_table.closest(".progressive-table-wrapper"));
}

function format_attachment_data(new_attachments) {
    for (const attachment of new_attachments) {
        const time = new Date(attachment.create_time);
        attachment.create_time_str = timerender.render_now(time).time_str;
        attachment.size_str = bytes_to_size(attachment.size);
    }
}

export function update_attachments(event) {
    if (attachments === undefined) {
        // If we haven't fetched attachment data yet, there's nothing to do.
        return;
    }
    if (event.op === "remove" || event.op === "update") {
        attachments = attachments.filter((a) => a.id !== event.attachment.id);
    }
    if (event.op === "add" || event.op === "update") {
        format_attachment_data([event.attachment]);
        attachments.push(event.attachment);
    }
    upload_space_used = event.upload_space_used;
    // TODO: This is inefficient and we should be able to do some sort
    // of incremental ListWidget update instead.
    render_attachments_ui();
}

export function set_up_attachments() {
    // The settings page must be rendered before this function gets called.

    const $status = $("#delete-upload-status");
    loading.make_indicator($("#attachments_loading_indicator"), {
        text: $t({defaultMessage: "Loading…"}),
    });

    $("#uploaded_files_table").on("click", ".remove-attachment", (e) => {
        const file_name = $(e.target).closest(".uploaded_file_row").attr("id");
        delete_attachments(
            $(e.target).closest(".uploaded_file_row").attr("data-attachment-id"),
            file_name,
        );
    });

    channel.get({
        url: "/json/attachments",
        success(data) {
            loading.destroy_indicator($("#attachments_loading_indicator"));
            format_attachment_data(data.attachments);
            attachments = data.attachments;
            upload_space_used = data.upload_space_used;
            render_attachments_ui();
        },
        error(xhr) {
            loading.destroy_indicator($("#attachments_loading_indicator"));
            ui_report.error($t_html({defaultMessage: "Failed"}), xhr, $status);
        },
    });
}
