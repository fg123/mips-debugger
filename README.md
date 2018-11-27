# mips-debugger
Quick JS Debugger for MIPS 

# Simulating mips.twoints
You can simulate mips.twoints by simply setting the default values of register 1
and 2 before pressing Run. These must be entered in HEX format.

# Simulating mips.array
This is a bit harder. You have to load in the values of your array into some
space in the memory. Choose some address above the stack address at
`0x01000000` e.g. `0x00ffffb0` (this one is nice because you can still see it
in the stack display, but if your program will write to the stack upwards, you
might want to choose a lower address so it doesn't collide with the stack. You
can then load your array values one by one before your program starts by writing
some assembly before the start of your program.

Let's say I wanted to load the array `[1, 2, 3]` into my program.
Normally you would have to write something like
```
; Load 1
lis $3
.word 0x00ffffb0
lis $4
.word 1
lw $4, 0($3)

; Load 2
lis $4
.word 2
lw $4, 4($3)
...
```
This is tedious so my assembler has a shorthand:
```
.memory 0x00ffffb0 1
.memory 0x00ffffb4 2
.memory 0x00ffffb8 3
```
You then need to set the initial value of $1 to be `0x00ffffb0` and $2 to be
the size of the array, in this case `3`. You can also do this in the code so
that resetting the emulator doesn't lose the values.
```
lis $1
.word 0x00ffffb0
lis $2
.word 3
```

