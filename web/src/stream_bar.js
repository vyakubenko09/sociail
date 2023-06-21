import * as stream_data from "./stream_data";

// In an attempt to decrease mixing, set stream bar
// color look like the stream being used.
// (In particular, if there's a color associated with it,
//  have that color be reflected here too.)
export function decorate(stream_name, $element) {
    if (stream_name === undefined) {
        return;
    }
    const color = stream_data.get_color(stream_name);
    $element.css("background-color", color);
}
