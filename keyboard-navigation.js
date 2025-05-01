console.log("Keyboard navigation enabled.");

const focus_keys = "jdkslaieurowghtzvncmxby";

var current_focusables = [];
var are_focusables_marked = false;
var current_markings = [];

var marking_parent = document.createElement("div");
marking_parent.style.display = "none";
document.body.appendChild(marking_parent);

var name_input = [];

function get_focusables() {
    let focusables = document.querySelectorAll(
        `a[href], area[href], input:not([disabled]),
         select:not([disabled]), textarea:not([disabled]),
         button:not([disabled]), iframe:not([disabled]),
         [tabindex] [onclick]`
    );

    return focusables;
}

function print_current_focusables() {
    const tags = [ "A", "AREA", "INPUT", "SELECT", "BUTTON",
                   "IFRAME" ];
    let tagCounts = Array(tags.length).fill(0);

    for (let i = 0; i < current_focusables.length; i++) {
        for (let j = 0; j < tags.length; j++) {
            if (current_focusables[i].tagName === tags[j]) {
                tagCounts[j]++;
            }
        }
    }

    for (let j = 0; j < tags.length; j++) {
        console.log("tag", tags[j], "count", tagCounts[j]);
    }
}

function update_current_focusables() {
    current_focusables = [];

    let focusables = get_focusables();

    let viewport = window.visualViewport;
    for (let i = 0; i < focusables.length; i++) {
        let rect = focusables[i].getBoundingClientRect();
        if (rect.x + rect.width < 0) {
            continue;
        }

        if (rect.y + rect.height < 0) {
            continue;
        }

        if (rect.x > window.innerWidth) {
            continue;
        }

        if (rect.y > window.innerHeight) {
            continue;
        }

        if (focusables[i].offsetHeight <= 0 || focusables[i].offsetWidth <= 0) {
            continue;
        }

        let computedStyle = window.getComputedStyle(focusables[i]);
        if (window.getComputedStyle(focusables[i]).visibility === "hidden") {
            continue;
        }
        
        if (window.getComputedStyle(focusables[i]).display === "none") {
            continue;
        }

        current_focusables.push(focusables[i]);
    }
}

function compute_index_name_char_count() {
    let indexNameCharCount = 1;
    let focusableCount = current_focusables.length;
    while (focusableCount > focus_keys.length - 1) {
        focusableCount = Math.floor(focusableCount / focus_keys.length);
        indexNameCharCount++;
    }

    return indexNameCharCount;
}

function mark_current_focusables() {

    marking_parent.style.display = "block";

    for (let i = current_markings.length; i < current_focusables.length; i++) {
        let marking = document.createElement("div");
        marking.style.position = "fixed";
        marking.style.background = "lightBlue";
        marking.style.border = "solid";
        marking.style.borderWidth = "1px";
        marking.style.padding = "2px";
        marking.style.zIndex = "100000";
        marking.style.display = "block";
        current_markings.push(marking);
        marking_parent.appendChild(marking);
    }


    let indexNameCharCount = compute_index_name_char_count();

    for (let i = 0; i < current_focusables.length; i++) {
        let rect = current_focusables[i].getBoundingClientRect();
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

        let marking = current_markings[i];
        marking.style.left = `${markingX + Math.random() * 4}px`;
        marking.style.top = `${markingY + Math.random() * 4}px`;
        marking.innerText = index_to_name(i, indexNameCharCount).join("");
        marking.style.display = "block";
    }
}

function unmark_untypeable_focusables() {
    let charCount = compute_index_name_char_count();
    for (let i = 0; i < current_focusables.length; i++) {
        let current_name = index_to_name(i, charCount);
        let not_prefix = false;
        for (let j = 0; j < name_input.length; j++) {
            if (current_name[j] != name_input[j]) {
                not_prefix = true;
                break;
            }
        }

        if (not_prefix) {
            current_markings[i].style.display = "none";
        }
    }
}

function index_to_name(index, charCount) { 
    let name = Array(charCount).fill("");
    for (let i = 0; i < charCount; i++) {
        name[i] = focus_keys[index % focus_keys.length];
        index = Math.floor(index / focus_keys.length);
    }

    return name;
}

function name_to_index(name, charCount) {
    let index = 0;
    for (let i = charCount - 1; i >= 0; i--) {
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

function remove_current_markings() {
    marking_parent.style.display = "none";
    name_input = [];
}

addEventListener("keyup", (event) => {
    if (event.key == "Escape" && are_focusables_marked) {
        remove_current_markings();
        are_focusables_marked = false;
        event.stopPropagation();
        event.preventDefault();
        return false;
    }

    if (event.key.length != 1) {
        return;
    }

    if (event.key == "f") {
        if (are_focusables_marked) {
            remove_current_markings();
        } else {
            update_current_focusables();
            mark_current_focusables();
        }
        are_focusables_marked = !are_focusables_marked;
        event.stopPropagation();
        event.preventDefault();
        return false;
    } 

    if (are_focusables_marked) {
        name_input.push(event.key);
        unmark_untypeable_focusables();

        let indexCharCount = compute_index_name_char_count();
        if (name_input.length === indexCharCount) {
            let index = name_to_index(name_input, indexCharCount);

            remove_current_markings();
            are_focusables_marked = false;

            if (index != -1) {
                current_focusables[index].focus({ focusVisible: true });
            }
        }
        event.stopPropagation();
        event.preventDefault();
        return false;
    }
});

addEventListener("scroll", (event) => {
    if (are_focusables_marked) {
        remove_current_markings();
        are_focusables_marked = false;
    }
});

