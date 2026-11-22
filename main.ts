// Tiny Stack VM: a complete interpreter of make.fun's tiny stack ISA v1.
// For every /input/<id>/ it runs program.bin on input.bin and writes
// /output/<id>/stdout.bin and exit.txt. Faithful to the reference VM:
// 32-bit wrapping arithmetic, 256-value stack, 64 return addresses, 256
// words of memory, all ten traps with their own codes. Deterministic: no
// clock, no randomness, no environment reads except the harness's dirs.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const K = new Uint8Array(256), M = new Uint8Array(256), A = new Uint8Array(256), B = new Uint8Array(256);
const s = (o: number, i: number, a: number, b: number) => { K[o] = 1; M[o] = i; A[o] = a; B[o] = b };
s(0, 0, 0, 0); s(1, 1, 0, 1); s(2, 4, 0, 1); s(3, 0, 1, 0); s(4, 0, 1, 2); s(5, 0, 2, 2); s(6, 0, 2, 3); s(7, 0, 3, 3);
for (let o = 16; o < 35; o++) if (o !== 31) s(o, 0, 2, 1);
s(23, 0, 1, 1); s(27, 0, 1, 1);
s(48, 2, 0, 0); s(49, 2, 1, 0); s(50, 2, 1, 0); s(51, 2, 0, 0); s(52, 0, 0, 0);
s(64, 0, 1, 1); s(65, 0, 2, 0); s(80, 0, 1, 0); s(81, 0, 1, 0); s(82, 0, 0, 1); s(83, 0, 1, 0);
function run(p: Uint8Array, g: Uint8Array): { o: Uint8Array; e: number } {
  const D = new Int32Array(256); let q = 0;
  const C = new Int32Array(64); let c = 0;
  const Y = new Int32Array(256);
  const o = new Uint8Array(65536); let l = 0, i = 0, pc = 0, t = 0;
  const n = p.length;
  const f = (e: number) => ({ o: o.slice(0, l), e });
  for (;;) {
    if (t === 1000000) return f(10); // step limit
    if (pc < 0 || pc >= n) return f(9); // pc outside the program
    const z = p[pc];
    if (!K[z]) return f(5); // unknown opcode
    const m = M[z];
    if (pc + m >= n) return f(9); // immediate cut off by the end
    t++;
    const x = pc + 1 + m;
    pc = x;
    const a = A[z];
    if (q < a) return f(2); // stack underflow
    if (q - a + B[z] > 256) return f(3); // stack overflow
    switch (z) {
      case 0: return f(0); // HALT
      case 1: D[q++] = (p[x - 1] << 24) >> 24; break; // PUSH8, sign-extended
      case 2: D[q++] = p[x - 4] | p[x - 3] << 8 | p[x - 2] << 16 | p[x - 1] << 24; break; // PUSH32
      case 3: q--; break; // POP
      case 4: D[q] = D[q - 1]; q++; break; // DUP
      case 5: { const v = D[q - 1]; D[q - 1] = D[q - 2]; D[q - 2] = v; break; } // SWAP
      case 6: D[q] = D[q - 2]; q++; break; // OVER
      case 7: { const v = D[q - 3]; D[q - 3] = D[q - 2]; D[q - 2] = D[q - 1]; D[q - 1] = v; break; } // ROT
      case 23: D[q - 1] = -D[q - 1] | 0; break; // NEG, wraps
      case 27: D[q - 1] = ~D[q - 1]; break; // NOT
      case 16: case 17: case 18: case 19: case 20: case 21: case 22:
      case 24: case 25: case 26: case 28: case 29: case 30: case 32: case 33: case 34: {
        const d = D[q - 1], u = D[q - 2];
        let r: number;
        if (z === 16) r = (u + d) | 0;
        else if (z === 17) r = (u - d) | 0;
        else if (z === 18) r = Math.imul(u, d); // low 32 bits, exact
        else if (z === 19) { if (!d) return f(4); r = u === -2147483648 && d === -1 ? u : (u / d) | 0; }
        else if (z === 20) { if (!d) return f(4); r = d === -1 ? 0 : (u % d) | 0; } // sign of u
        else if (z === 21) { if (!d) return f(4); r = Math.floor((u >>> 0) / (d >>> 0)) | 0; } // DIVU
        else if (z === 22) { if (!d) return f(4); r = ((u >>> 0) % (d >>> 0)) | 0; } // MODU
        else if (z === 24) r = u & d;
        else if (z === 25) r = u | d;
        else if (z === 26) r = u ^ d;
        else if (z === 28) r = u << (d & 31); // only the low 5 bits count
        else if (z === 29) r = u >> (d & 31); // arithmetic
        else if (z === 30) r = (u >>> (d & 31)) | 0; // logical
        else if (z === 32) r = u === d ? 1 : 0;
        else if (z === 33) r = u < d ? 1 : 0;
        else r = (u >>> 0) < (d >>> 0) ? 1 : 0; // LTU, unsigned
        q -= 2; D[q++] = r;
        break;
      }
      case 48: case 49: case 50: {
        const w = ((p[x - 2] | p[x - 1] << 8) << 16) >> 16; // signed 16-bit offset
        let k = z === 48;
        if (z !== 48) { const v = D[--q]; k = z === 49 ? v === 0 : v !== 0; }
        if (k) pc = x + w; // target unchecked until the next step
        break;
      }
      case 51:
        if (c === 64) return f(7); // call stack overflow
        C[c++] = x; pc = p[x - 2] | p[x - 1] << 8; // unsigned 16-bit target
        break;
      case 52:
        if (!c) return f(8); // RET with an empty call stack
        pc = C[--c];
        break;
      case 64: { const v = D[q - 1]; if (v < 0 || v > 255) return f(6); D[q - 1] = Y[v]; break; } // LOAD
      case 65: { const v = D[q - 1], u = D[q - 2]; if (v < 0 || v > 255) return f(6); q -= 2; Y[v] = u; break; } // STORE
      case 80: { const v = String(D[q - 1]); if (l + v.length > 65536) return f(11); q--; for (let j = 0; j < v.length; j++) o[l++] = v.charCodeAt(j); break; } // PRINT
      case 81:
        if (l + 1 > 65536) return f(11);
        o[l++] = D[--q] & 255; // PUTC
        break;
      case 82: D[q++] = i < g.length ? g[i++] : -1; break; // IN, -1 past the end
      case 83: return f(D[--q] & 255); // EXIT, low byte
    }
  }
}
const I = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const O = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
for (const d of readdirSync(I).sort()) {
  const r = run(readFileSync(join(I, d, 'program.bin')), readFileSync(join(I, d, 'input.bin')));
  mkdirSync(join(O, d), { recursive: true });
  writeFileSync(join(O, d, 'stdout.bin'), r.o);
  writeFileSync(join(O, d, 'exit.txt'), r.e + '\n');
}
