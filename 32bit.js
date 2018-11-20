class Int32 {
    // This either stores a negative value or a positive one.
    constructor(value) {
        this.value = value;
    }

    toString() {
        let val = this.value;
        if (this.value < 0) {
            val = 0xFFFFFFFF + val + 1;
        }
        return val.toString(16).padStart(8, '0');
    }

    toSigned() {
        return this.value;
    }

    toUnsigned() {
        return parseInt('0x' + this.toString());
    }
}
