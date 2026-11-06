# Lesson 1 — Bits, bytes, binary, and hexadecimal

## Goal

By the end, you should be able to convert small binary and hexadecimal values,
identify the most- and least-significant bits, and explain why the *same bits*
can mean different numbers depending on how they are interpreted.

## 1. A computer stores bits

A **bit** is one binary digit: `0` or `1`. A group of eight bits is a **byte**.
For an 8-bit value, label the positions from right to left, starting at zero:

| Position | 7 | 6 | 5 | 4 | 3 | 2 | 1 | 0 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Weight | 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |

The leftmost bit is the **MSB** (most-significant bit); the rightmost is the
**LSB** (least-significant bit).

## 2. Binary is positional notation

Each bit contributes its weight when it is `1` and contributes zero when it is
`0`. For example:

```text
1101₂ = 1×8 + 1×4 + 0×2 + 1×1 = 13₁₀
```

For a longer example:

```text
01010011₂ = 64 + 16 + 2 + 1 = 83₁₀
```

## 3. Hexadecimal is a compact way to write bits

One hexadecimal digit represents exactly four bits. Group a binary value into
nibbles (groups of four) from the right:

```text
0101 0011₂  =  5 3₁₆  =  53₁₆
```

The digits after `9` are `A=10`, `B=11`, `C=12`, `D=13`, `E=14`, and `F=15`.
For example, `D₁₆ = 1101₂`.

## 4. Fixed width changes what values fit

With eight bits there are 256 possible patterns. If interpreted as **unsigned**,
the range is `0` through `255`. If interpreted as **8-bit two's complement**,
the range is `−128` through `127`.

Take the pattern `11100010₂` (`E2₁₆`):

- Unsigned interpretation: `128+64+32+2 = 226`.
- Two's-complement interpretation: the MSB is `1`, so it is negative. Invert
  the bits and add one: `00011101 + 1 = 00011110₂ = 30`; therefore the value is
  `−30`.

The stored bits did not change. The **interpretation** changed. This distinction
will matter for subtraction, carry/overflow flags, and exam questions.

## Practice — try these before opening the answers

1. Convert `10110₂` to decimal.
2. Convert `3A₁₆` to binary.
3. Interpret `11100010₂` as an unsigned 8-bit value and as an 8-bit
   two's-complement value.
4. What are the MSB and LSB of `10010110₂`?

<details>
<summary>Check your answers</summary>

1. `22₁₀`.
2. `0011 1010₂`.
3. Unsigned: `226`; two's complement: `−30`.
4. MSB: `1`; LSB: `0`.

</details>

## Interactive visualization

Open [the binary-byte lab](../visuals/01-binary-byte-lab.html), click the bit
tiles, and compare the unsigned and signed interpretations. Try the `53` and
`E2` presets.
