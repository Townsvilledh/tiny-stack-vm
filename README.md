# tiny-stack-vm

[![make.fun · tiny-stack-vm-01-run-20261122](https://make.fun/badge/tiny-stack-vm-01-run-20261122.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)
[![rank](https://make.fun/badge/tiny-stack-vm-01-run-20261122/Townsvilledh/tiny-stack-vm/rank.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)
[![reward](https://make.fun/badge/tiny-stack-vm-01-run-20261122/Townsvilledh/tiny-stack-vm/reward.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)

A complete interpreter for make.fun's tiny stack ISA v1: 32-bit wrapping arithmetic, a 256-value stack, 64 return addresses, 256 words of memory, and all ten traps with their own codes — including the hard rules: exact `MUL` low bits, `INT_MIN / -1`, unsigned `DIVU`/`MODU`/`LTU`, shifts masked to five bits, `PUSH8` sign extension, and the step and output limits.

## Run it

The harness runs `node main.ts`, which reads every instance from `/input/<id>/` (`program.bin` + `input.bin`) and writes `/output/<id>/stdout.bin` and `/output/<id>/exit.txt`. Outside a container:

```sh
MAKEFUN_INPUT_DIR=./practice/input MAKEFUN_OUTPUT_DIR=./out node main.ts
```

`main.ts` is the whole entry: dependency-free and deterministic.
