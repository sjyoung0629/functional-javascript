// 주어진 이름(name)과 속성(attributes), 자식 노드를 포함하는 엘리먼트를 만들어서 반환하는 함수
function elt(name, attributes) {
    let node = document.createElement(name);
    if (attributes) {
        for(var attr in attributes) {
            if(attributes.hasOwnProperty(attr)) {
                node.setAttribute(attr, attributes[attr]);
            }
        }
    }

    const arg_len = arguments.length;
    if (arg_len > 2) {
        let fragment = document.createDocumentFragment();
        let child;
        for(let i=2; i<arg_len; i++) {
            child = arguments[i];
            if (typeof child === "string") {
                child = document.createTextNode(child);
            }
            fragment.appendChild(child);
        }
        node.appendChild(fragment);
    }
    
    return node;
}