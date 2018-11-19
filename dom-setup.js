const codeMirror = CodeMirror.fromTextArea(
    document.querySelector('div.editor textarea'),
    {
        mode: "mips",
        lineNumbers: true,
        gutters: ["CodeMirror-linenumbers", "breakpoints"]
});

codeMirror.on("gutterClick", function(cm, n) {
    const info = cm.lineInfo(n);
    cm.setGutterMarker(n,
        "breakpoints", info.gutterMarkers ? null : makeMarker());
});

function makeMarker() {
    const marker = document.createElement("div");
    marker.style.color = "#822";
    marker.style.fontSize = "14px";
    marker.innerHTML = "●";
    return marker;
}

const regInitial = document.querySelector('div.initial');
const registerInputs = [];
function domReset() {
    regInitial.innerHTML = '';
    registerInputs.length = 0;
    for (let i = 0; i < 33; i++) {
        const div = document.createElement('div');
        const n = i;
        const label = i !== 32 ? (n < 10 ? '0' + n : n) : "<b>pc</b>"
        const value = i === 31 ? "DEADBEEF" : i === 30 ? "1000000" : "0";
        div.innerHTML = `
            <span>${label}: 0x</span>
            <input pattern="[0-9a-fA-F]+"
                type="text" maxlength="8" size="8"
                value="${value}"
                ${ i === 0 || i >= 31 ? "disabled" : ""}>
        `;
        regInitial.append(div);
        registerInputs.push(div.querySelector('input'));
    }    
}
domReset();