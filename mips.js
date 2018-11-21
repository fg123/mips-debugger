// codeMirror is the editor instance

let currentlyRunning = false;
let currentState = { code: undefined, state: undefined };

function createEmulatorState() {
    const obj = {
        registers: Array(32),
        pc: 0,
        memory: Array(16777216),
        hi: 0,
        lo: 0,
        symbolTable: {},
        lastLine: undefined
    };
    for (let i = 0; i < 32; i++) {
        obj.registers[i] = new Int32(parseInt('0x' + registerInputs[i].value));
    }
    return obj;
};

function mips(input) {
    const emulatorState = createEmulatorState();
    const lines = input.split('\n');
    const compiled = compile(lines);

    emulatorState.symbolTable = compiled.symbolTable;

    console.log(compiled);
    console.log(emulatorState);
    for (let i = 0; i < compiled.code.length; i++) {
        emulatorState.memory[i] = compiled.code[i];
    }
    for (let i = 0; i < compiled.memoryInitial.length; i++) {
        const initial = compiled.memoryInitial[i];
        emulatorState.memory[initial.location / 4] = initial.number;
    }

    currentState = { code: compiled.code, state: emulatorState }
    continueExecution(false, false);
}

function run() {
    if (!currentlyRunning) {
        currentlyRunning = true;
        console.log(codeMirror);
        codeMirror.options.readOnly = "nocursor";
        outputTextarea.innerHTML = 'Output:\n';
        registerInputs.forEach(input => { input.disabled = true; });
        mips(codeMirror.getValue());
    }
}

function stop() {
    currentlyRunning = false;
    codeMirror.options.readOnly = false;
    for (let i = 1; i <= 30; i++) {
        registerInputs[i].disabled = false;
    }
}

function reset() {
    domReset();
    currentState = { code: undefined, state: undefined };
}

const getRegister = (reg) => {
    if (!reg || reg[0] !== '$') throw reg + ' is not a register!';
    let register = parseInt(reg.substr(1));
    if (register < 0 || register >= 32) {
        throw 'Register must be between 0 or 32, found ' + register;
    }
    return register;
};

function dec2bin(dec) {
    return (dec >>> 0).toString(2).padStart(64, '0');
}

function loadFromMemory(state, address) {
    if (address % 4 !== 0) {
        throw 'Unaligned memory access!';
    }
    const item = state.memory[address / 4];
    if (item === undefined) {
        return new Int32(0);
    } else if (item instanceof Int32) {
        return item;
    }
    else if (item.code[0] === '.word') {
        if (isNaN(item.code[1])) {
            /* Some kind of label */
            const label = item.code[1];
            if (label === 'print') {
                /* special, if you try to jump to 1111, it's print */
                return new Int32(1111);
            }
            return new Int32(state.symbolTable[label]);
        }
        return new Int32(parseInt(item.code[1]));
    }
    console.log(item);
    throw 'Cannot get memory of code that\'s not .word!';
}

function saveToMemory(state, address, item) {
    if (address % 4 !== 0) {
        throw 'Unaligned memory access!';
    }
    state.memory[address / 4] = item;
}

const actions = {
    add(state, args) {
        const dest = getRegister(args[0]);
        const lhs = getRegister(args[1]);
        const rhs = getRegister(args[2]);
        state.registers[dest] =
            new Int32(state.registers[lhs].toSigned() + state.registers[rhs].toSigned());
    },
    sub(state, args) {
        const dest = getRegister(args[0]);
        const lhs = getRegister(args[1]);
        const rhs = getRegister(args[2]);
        state.registers[dest] =
            new Int32(state.registers[lhs].toSigned() - state.registers[rhs].toSigned());
    },
    mult(state, args) {
        const lhs = getRegister(args[0]);
        const rhs = getRegister(args[1]);
        const result = state.registers[lhs].toSigned() * state.registers[rhs].toSigned();
        state.lo = result;
        // state.hi = parseInt(result.substr(0, 32), 2);
    },
    multu(state, args) {
        const lhs = getRegister(args[0]);
        const rhs = getRegister(args[1]);
        const result = state.registers[lhs].toUnsigned() * state.registers[rhs].toUnsigned();
        state.lo = result;
        // state.hi = parseInt(result.substr(0, 32), 2);
    },
    div(state, args) {
        const lhs = getRegister(args[0]);
        const rhs = getRegister(args[1]);
        state.lo = Math.floor(state.registers[lhs].toSigned() / state.registers[rhs].toSigned());
        state.hi = state.registers[lhs].toSigned() % state.registers[rhs].toSigned();
    },
    divu(state, args) {
        const lhs = getRegister(args[0]);
        const rhs = getRegister(args[1]);
        state.lo = Math.floor(state.registers[lhs].toUnsigned() / state.registers[rhs].toUnsigned());
        state.hi = state.registers[lhs].toUnsigned() % state.registers[rhs].toUnsigned();
    },
    mfhi(state, args) {
        const dest = getRegister(args[0]);
        state.registers[dest] = new Int32(state.hi);
    },
    mflo(state, args) {
        const dest = getRegister(args[0]);
        state.registers[dest] = new Int32(state.lo);
    },
    lis(state, args) {
        const dest = getRegister(args[0]);
        const next = loadFromMemory(state, state.pc);
        state.registers[dest] = next;
        state.pc += 4;
    },
    lw(state, args) {
        const dest = getRegister(args[0]);
        const offset = parseInt(args[1]);
        const source = getRegister(args[2]);
        console.log("Load word ")
        state.registers[dest] = loadFromMemory(
            state,
            state.registers[source].toUnsigned() + offset
        );
    },
    sw(state, args) {
        const from = getRegister(args[0]);
        const offset = parseInt(args[1]);
        const dest = getRegister(args[2]);
        saveToMemory(state,
            state.registers[dest].toUnsigned() + offset,
            state.registers[from]);
    },
    slt(state, args) {
        const dest = getRegister(args[0]);
        const lhs = getRegister(args[1]);
        const rhs = getRegister(args[2]);
        state.registers[dest] = new Int32(
            state.registers[lhs].toSigned() < state.registers[rhs].toSigned() ? 1 : 0);
    },
    slt(state, args) {
        const dest = getRegister(args[0]);
        const lhs = getRegister(args[1]);
        const rhs = getRegister(args[2]);
        state.registers[dest] = new Int32(
            state.registers[lhs].toUnsigned() < state.registers[rhs].toUnsigned() ? 1 : 0);
    },
    beq(state, args) {
        const lhs = getRegister(args[0]);
        const rhs = getRegister(args[1]);
        let offset = 0;
        if (isNaN(args[2])) {
            // Must be a String / Symbol
            offset = (state.symbolTable[args[2]] - state.pc) / 4;
        }
        else {
            offset = parseInt(args[2]);
        }
        if (state.registers[lhs].toUnsigned() == state.registers[rhs].toUnsigned()) {
            state.pc += offset * 4;
        }
    },
    bne(state, args) {
        const lhs = getRegister(args[0]);
        const rhs = getRegister(args[1]);
        let offset = 0;
        if (isNaN(args[2])) {
            // Must be a String / Symbol
            offset = (state.symbolTable[args[2]] - state.pc) / 4;
        }
        else {
            offset = parseInt(args[2]);
        }
        if (state.registers[lhs].toUnsigned() != state.registers[rhs].toUnsigned()) {
            state.pc += offset * 4;
        }
    },
    jr(state, args) {
        const register = getRegister(args[0]);
        const jumpTo = state.registers[register].toUnsigned();
        if (jumpTo === 1111) {
            /* Special Print */
            outputTextarea.innerHTML += state.registers[1].toSigned().toString() + "\n";
            return;
        }
        state.pc = state.registers[register].toUnsigned();
    },
    jalr(state, args) {
        const register = getRegister(args[0]);
        const jumpTo = state.registers[register].toUnsigned();
        if (jumpTo === 1111) {
            /* Special Print */
            outputTextarea.innerHTML += state.registers[1].toSigned().toString() + "\n";
            return;
        }
        state.registers[31] = new Int32(state.pc);
        state.pc = jumpTo;
    }
};

const OS = parseInt('0x8123456C');

function continueExecution(ignoreNextBreak, forceOne) {
    const code = currentState.code;
    const state = currentState.state;
    try {
        while (true) {
            const line = code[state.pc / 4].line;
            const parts = code[state.pc / 4].code;
            if (state.lastLine !== undefined) {
                codeMirror.removeLineClass(state.lastLine, "background", "active");
            }
            if (parts[0][0] !== '.') {
                state.lastLine = line;
                codeMirror.addLineClass(line, "background", "active");
            }
            const lineInfo =
                codeMirror.doc.lineInfo(code[state.pc / 4].line);
            if ((!ignoreNextBreak && forceOne) ||
                (lineInfo.gutterMarkers &&
                lineInfo.gutterMarkers["breakpoints"] &&
                !ignoreNextBreak)) {
                console.log('Breakpoint!');
                console.log(lineInfo);
                return;
            }
            if (ignoreNextBreak) ignoreNextBreak = false;
            state.pc += 4;

            emulate(line, parts, state);
            updateUI(state);
            if (state.pc === OS) {
                if (state.lastLine !== undefined) {
                    codeMirror.removeLineClass(state.lastLine,
                        "background", "active");
                }
                stop();
                return;
            }
        }
    }
    catch (e) {
        updateUI(state);
        return;
    }
}

/* Runs one step */
function emulate(line, parts, state) {
    try {
        if (parts[0][0] !== '.') {
            console.log ('Emulating ' + parts[0]);
            actions[parts[0]](state, parts.slice(1, parts.length));
        }
    }
    catch (e) {
        alert('Error on line ' + line + ': ' + e);
        throw e;
    }
}

function updateUI(state) {
    /* Registers */
    for (let i = 0; i < 32; i++) {
        registerInputs[i].value = state.registers[i].toString();
    }
    registerInputs[32].value = state.pc.toString(16).padStart(8, '0');

    for (let i = memoryStart; i <= memoryEnd; i += 4) {
        let item = state.memory[i / 4];
        if (item === undefined) {
            item = 0;
        }
        let label = "";
        if (i === state.registers[29].toUnsigned()) label += "(FP)";
        if (i === state.registers[30].toUnsigned()) label += "(SP)";
        options[(i - memoryStart) / 4].innerHTML =
            '0x' + i.toString(16).padStart(8, '0') + ': ' +
            '0x' + item.toString(16).padStart(8, '0') + label;
    }
}

function compile(code) {
    const symbolTable = {};
    const result = [];
    const memoryInitial = [];
    for (let i = 0; i < code.length; i++) {
        let line = code[i];
        const cIdx = line.indexOf(';');
        if (cIdx !== -1) {
            line = line.substr(0, cIdx);
        }
        line = line.trim().replace(/\(|\)|\,/g, ' ');

        const parts = line.split(' ').filter(x => x);
        if (parts.length === 0) {
            /* Empty */
            continue;
        }
        /* Possible label */
        if (parts[0][parts[0].length - 1] === ':') {
            const label = parts[0].substr(0, parts[0].length - 1);
            /* Next instruction */
            symbolTable[label] = result.length * 4;
            parts.splice(0, 1);
        }
        if (parts[0] === '.memory') {
            if (parts[1] && parts[2]) {
                memoryInitial.push({
                    location: parseInt(parts[1]),
                    number: new Int32(parseInt(parts[2]))
                });
            }
        }
        if (parts[0]) {
            result.push({
                line: i,
                code: parts
            });
        }
    }
    return { code: result, symbolTable, memoryInitial };
}
