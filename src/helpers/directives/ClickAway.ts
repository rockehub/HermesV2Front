import { type Directive, type DirectiveBinding } from 'vue';

const clickAway: Directive = {
    beforeMount(el, binding) {
        el.clickAwayEvent = (event: Event) => {
            if (!(el === event.target || el.contains(event.target as Node))) {
                binding.value(event);
            }
        };
        document.body.addEventListener("click", el.clickAwayEvent);
    },
    beforeUnmount(el) {
        document.body.removeEventListener("click", el.clickAwayEvent);
    }
}

export default clickAway;