// Copyright (C) 2025  Áron Hárnási

const submit_button = document.getElementById("save");
const focus_keys_input = document.getElementById("focus-keys");
const error_message_p = document.getElementById("error-message");
const success_message_p = document.getElementById("success-message");
const settings_form = document.getElementById("settings-form");
const reset_button = document.getElementById("reset");

const defaultFocusKeys = "jdkslaieurowghtzvncmxby";

const sync_storage = chrome?.storage.sync || browser?.storage.sync;

settings_form.addEventListener("submit", (event) => {
    event.preventDefault();

    const focus_keys_value = focus_keys_input.value;

    if (focus_keys_value.length < 2) {
        error_message_p.innerText = 
            "Focus keys needs to be at least two characters.";
        return false;
    }

    if (focus_keys_value !== focus_keys_value.toLowerCase()) {
        error_message_p.innerText = 
            "Focus keys needs to be contain only lowercase characters.";
        return false;
    }

    for (var i = 0; i < focus_keys_value.length; i++) {
        for (var j = 0; j < focus_keys_value.length; j++) {
            if (i !== j && focus_keys_value[i] === focus_keys_value[j]) {
                error_message_p.innerText =
                    "Focus keys can't contain duplicate characters.";
                return false;
            }
        }
    }

    error_message_p.innerText = "";
    success_message_p.innerText = "";

    let set_settings = sync_storage.set({ settings: {
        focusKeys: focus_keys_value
    }});
    set_settings.then(() => {
        success_message_p.innerText = "Settings were saved successfully.";
    }, (e) => {
        error_message_p.innerText = "Error saving settings. " + e.toString();
    });

    return false;
});

document.addEventListener("DOMContentLoaded", () => {
    let get_settings = sync_storage.get("settings");

    get_settings.then((result) => {
        focus_keys_input.disabled = false;
        focus_keys_input.value = result.settings?.focusKeys
                                 || defaultFocusKeys;
    }, () => {
        focus_keys_input.disabled = false;
        focus_keys_input.value = defaultFocusKeys;
    });
});

reset_button.addEventListener("click", (event) => {
    event.preventDefault();
    focus_keys_input.value = defaultFocusKeys;
});
