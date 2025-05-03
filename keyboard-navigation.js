// keyboard-navigation: A simple tool to navigate a webpage.
// Copyright (C) 2025  Áron Hárnási
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

// Constants
const whitespace_chars = " \t\n";

// Config variables
var config_select_keys          = "jdklaieurowghtzvncmxby";
var config_marking_font_size_px = 12;
var config_marking_font_family  = "monospace";

// Document object
const marking_parent_div = document.createElement("div");
const document_selection = document.getSelection();

// Browser abstractions
const sync_storage = chrome?.storage.sync || browser?.storage.sync;

// Modes
const mode_normal               = "mode_normal";
const mode_select_focus         = "mode_select_focus";
const mode_select_textual       = "mode_select_textual";

// State
var state_mode               = mode_normal;
var state_selectables        = [];
var state_name_input         = [];
var state_range_textual      = document.createRange();
var state_markings           = [];
var state_marking_char_count = 0;

function state_set_marking_char_count() {
    state_marking_char_count = 1;

    let selectable_count = state_selectables.length;
    while (selectable_count > config_select_keys.length - 1) {
        selectable_count = Math.floor(selectable_count / focus_keys.length);
        state_marking_char_count++;
    }
}

function html_element_is_visible(element) {
    let rect = element.getBoundingClientRect();
    if (rect.x + rect.width < 0) {
        return false;
    }

    if (rect.y + rect.height < 0) {
        return false;
    }

    if (rect.x > window.innerWidth) {
        return false;
    }

    if (rect.y > window.innerHeight) {
        return false;
    }

    if (element.offsetHeight <= 0 || element.offsetWidth <= 0) {
        return false;
    }

    let computed_style = window.getComputedStyle(element);
    if (computed_style.visibility === "hidden") {
        return false;
    }
    
    if (computed_style.display === "none") {
        return false;
    }

    return true;
}

function state_set_selectables_to_focusables() {
    state_selectables = [];

    let focusables = document.querySelectorAll(
        `a[href], area[href], input:not([disabled]),
         select:not([disabled]), textarea:not([disabled]),
         button:not([disabled]), iframe:not([disabled]),
         [tabindex], [onclick]`
    );

    for (let i = 0; i < focusables.length; i++) {
        if (html_element_is_visible(focusables[i])) {
            state_selectables.push(focusables[i]);
        }
    }

    state_set_marking_char_count();
}

function string_has_non_whitespace(str) {
    for (let i = 0; i < str.length; i++) {
        let found = false;
        for (let j = 0; j < whitespace_chars.length; j++) {
            if (str[i] === whitespace_chars[j]) {
                found = true;
                break;
            }
        }

        if (!found) {
            return true;
        }
    }

    return false;
}

// already_started is true if we already added the parent as a selectable.
function state_set_selectables_to_textuals_rec(element, already_started) {

    let add_to_selectables = false;
    for (let i = element.childNodes.length - 1; i >= 0; i--) {
        let child = element.childNodes[i];

        if (child instanceof HTMLElement) {

            let child_already_started = 
                i === 0 && (already_started || add_to_selectables);

            state_set_selectables_to_textuals_rec(child, child_already_started);

        } else if (child instanceof Text &&
                   child.textContent.length > 3 &&
                   string_has_non_whitespace(child.textContent)) {

            add_to_selectables = true;
        }
    }

    if (add_to_selectables) {
        if (html_element_is_visible(element)) {
            state_selectables.push(element);
        }
    }
}

function state_set_selectables_to_textuals() {
    state_selectables = [];
    state_set_selectables_to_textuals_rec(document.body, 
                                          /*already_started*/false);
    state_set_marking_char_count();
}

function mark_selectables() {

    for (let i = state_markings.length; i < state_selectables.length; i++) {
        let marking = document.createElement("div");
        marking.style.position = "fixed";
        marking.style.background = "lightBlue";
        marking.style.border = "solid";
        marking.style.borderWidth = "1px";
        marking.style.padding = "2px";
        marking.style.display = "block";

        state_markings.push(marking);
        marking_parent_div.appendChild(marking);
    }


    for (let i = 0; i < state_selectables.length; i++) {
        let rect = state_selectables[i].getBoundingClientRect();
        let markingX = rect.x;
        let markingY = rect.y;

        if (rect.x < 0) {
            if (rect.x + rect.width < window.innerWidth) {
                markingX = rect.x + rect.width;
            } else {
                markingX = rect.x + rect.width / 2;
            }
        }

        if (rect.y < 0) {
            if (rect.y + rect.height < window.innerHeight) {
                markingY = rect.y + rect.height;
            } else {
                markingY = rect.y + rect.height / 2;
            }
        }

        if (i < state_selectables.length - 1) {
            let next_selectable_rect = state_selectables[i]
                                       .getBoundingClientRect();

        }

        let marking = state_markings[i];
        marking.style.left = `${markingX + Math.random() * 4}px`;
        marking.style.top = `${markingY + Math.random() * 4}px`;
        marking.innerText = index_to_name(i).join("");
        marking.style.display = "block";
    }

    for (let i = state_selectables.length; i < state_markings.length; i++) {
        state_markings[i].style.display = "none";
    }

    marking_parent_div.style.display = "block";

}

function unmark_untypeable_selectables() {
    for (let i = 0; i < state_selectables.length; i++) {
        let current_name = index_to_name(i);
        let not_prefix = false;
        for (let j = 0; j < state_name_input.length; j++) {
            if (current_name[j] != state_name_input[j]) {
                not_prefix = true;
                break;
            }
        }

        if (not_prefix) {
            state_markings[i].style.display = "none";
        }
    }
}

function unmark_all() {
    marking_parent_div.style.display = "none";
}

function index_to_name(index) { 
    let name = Array(state_marking_char_count).fill("");
    for (let i = 0; i < state_marking_char_count; i++) {
        name[i] = focus_keys[index % focus_keys.length];
        index = Math.floor(index / focus_keys.length);
    }

    return name;
}

function name_to_index(name) {
    let index = 0;
    for (let i = state_marking_char_count - 1; i >= 0; i--) {
        let key_index = -1;
        for (let j = 0; j < focus_keys.length; j++) {
            if (focus_keys[j] == name[i]) {
                key_index = j;
                break;
            }
        }


        if (key_index == -1) {
            return -1;
        }

        index *= focus_keys.length;
        index += key_index;
    }

    return index;
}

function state_set_mode(next_mode) {
    if (state_mode === next_mode) {
        return false;
    }

    console.log("Mode transition:", state_mode, "->", next_mode);
    
    if (state_mode === mode_normal) {
        if (next_mode === mode_select_focus) {
            state_set_selectables_to_focusables();
            mark_selectables();
            state_name_input = [];
            state_mode = mode_select_focus;
            return true;
        }

        if (next_mode === mode_select_textual) {
            state_set_selectables_to_textuals();
            mark_selectables();
            state_name_input = [];
            state_mode = mode_select_textual;
            return true;
        }
    }

    if (state_mode === mode_select_focus) {
        if (next_mode === mode_normal) {
            unmark_all();
            state_mode = mode_normal;
            return true;
        }
    }

    if (state_mode === mode_select_textual) {
        if (next_mode === mode_normal) {
            unmark_all();
            state_mode = mode_normal;
        }
    }

    return false;
}

function event_listener_keyup_handler(key) {
    if (document.activeElement.tagName === "INPUT"
    ||  document.activeElement.isContentEditable) {
        return true;
    }

    if (key === "Escape" && state_set_mode(mode_normal)) {
        return false;
    }

    if (key.length != 1) {
        return true;
    }

    if (key === "f" && state_mode === mode_normal) {
        state_set_mode(mode_select_focus);
        return false;
    }

    if (key === "f" && state_mode === mode_select_focus &&
        config_select_keys.search("f") === -1) {

        state_set_mode(mode_normal);
        return false;
    }

    if (key === "s" && state_mode === mode_normal) {
        state_set_mode(mode_select_textual);
        return false;
    }

    if (state_mode === mode_select_focus ||
        state_mode === mode_select_textual) {

        state_name_input.push(key);
        unmark_untypeable_selectables();

        if (state_name_input.length === state_marking_char_count) {
            let index = name_to_index(state_name_input);

            if (index !== -1 && index < state_selectables.length) {
                if (state_mode === mode_select_focus) {
                    state_selectables[index].focus({ focusVisible: true });
                } else if (state_mode === mode_select_textual) {
                    let element = state_selectables[index];
                    state_range_textual.setStart(element, 0);
                    state_range_textual.setEnd(element,
                                               element.childNodes.length);
                    document_selection.removeAllRanges();
                    document_selection.addRange(state_range_textual);
                }
            }

            state_set_mode(mode_normal);
        }
        return false;
    }
}

function event_listener_keyup(event) {
    if (!event_listener_keyup_handler(event.key)) {
        event.stopImmediatePropagation();
        event.preventDefault();
        return false;
    }

    return true;
}

function event_listener_scroll(event) {
    if (state_mode === mode_select_focus ||
        state_mode === mode_select_textual) {

        state_set_mode(mode_normal);
    }
}

function init() {
    marking_parent_div.style.display    = "none";
    marking_parent_div.style.zIndex     = "2147483646";
    marking_parent_div.style.position   = "fixed";
    marking_parent_div.style.fontSize   = `${config_marking_font_size_px}px`;
    marking_parent_div.style.fontFamily = config_marking_font_family;
    marking_parent_div.style.color      = "black";
    document.body.appendChild(marking_parent_div);

    sync_storage.get("settings").then((result) => {
        if (result.settings != undefined) {
            focus_keys = result.settings?.focusKeys;
        }
    }, () => { console.log("Couldn't get focus keys. Using default value."); });

    document.addEventListener("keyup",  event_listener_keyup, {capture: true});
    document.addEventListener("scroll", event_listener_scroll);

    console.log("Keyboard navigation enabled.");
}

init();
