import * as blueslip from "./blueslip";

export const enum StreamPostPolicy {
    EVERYONE = 1,
    ADMINS = 2,
    RESTRICT_NEW_MEMBERS = 3,
    MODERATORS = 4,
}

export type Stream = {
    date_created: number;
    description: string;
    first_message_id: number | null;
    history_public_to_subscribers: boolean;
    invite_only: boolean;
    is_announcement_only: boolean;
    is_web_public: boolean;
    message_retention_days: number | null;
    name: string;
    rendered_description: string;
    stream_id: number;
    stream_post_policy: StreamPostPolicy;
};

export type StreamSpecificNotificationSettings = {
    audible_notifications: boolean | null;
    desktop_notifications: boolean | null;
    email_notifications: boolean | null;
    push_notifications: boolean | null;
    wildcard_mentions_notify: boolean | null;
};

export type StreamSubscription = (Stream & StreamSpecificNotificationSettings) & {
    color: string;
    email_address: string;
    in_home_view: boolean;
    is_muted: boolean;
    pin_to_top: boolean;
    stream_weekly_traffic: number | null;
    subscribers?: number[];
};

const subs_by_stream_id = new Map<number, StreamSubscription>();

export function get(stream_id: number): StreamSubscription | undefined {
    return subs_by_stream_id.get(stream_id);
}

export function validate_stream_ids(stream_ids: number[]): number[] {
    const good_ids = [];
    const bad_ids = [];

    for (const stream_id of stream_ids) {
        if (subs_by_stream_id.has(stream_id)) {
            good_ids.push(stream_id);
        } else {
            bad_ids.push(stream_id);
        }
    }

    if (bad_ids.length > 0) {
        blueslip.warn(`We have untracked stream_ids: ${bad_ids.toString()}`);
    }

    return good_ids;
}

export function clear(): void {
    subs_by_stream_id.clear();
}

export function delete_sub(stream_id: number): void {
    subs_by_stream_id.delete(stream_id);
}

export function add_hydrated_sub(stream_id: number, sub: StreamSubscription): void {
    // The only code that should call this directly is
    // in stream_data.js. Grep there to find callers.
    subs_by_stream_id.set(stream_id, sub);
}

export function maybe_get_stream_name(stream_id: number): string | undefined {
    if (!stream_id) {
        return undefined;
    }
    const stream = get(stream_id);

    if (!stream) {
        return undefined;
    }

    return stream.name;
}
