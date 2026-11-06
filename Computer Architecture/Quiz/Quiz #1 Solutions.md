# Quiz #1 — Worked Solutions

Personal details are intentionally omitted. The questions below follow the wording and order in the saved HTML form.

## 1. Unsigned 8-bit subtraction

**Question:** Using unsigned 8-bit representation, give in HEX the result of the following HEX operation: 7BH - B7H (answer example: 12345H).

`7BH - B7H = 123 - 183 = -60`. In 8-bit unsigned arithmetic, wrap modulo 256: `256 - 60 = 196 = C4H`.

**Answer: `C4H`**

## 2. Unsigned 16-bit subtraction

**Question:** Using unsigned 16-bit representation, give in decimal the result of the following HEX operation: 7BH - B7H (answer example: 12345).

Wrap modulo 65,536: `65,536 - 60 = 65,476` (`FFC4H` in 16-bit HEX).

**Answer: `65476`**

## 3. Carry signal

**Question:** Considering 8-bit CPU, which of the following HEX operations will generate a carry signal?

- 7BH + B7H
- 7BH - B7H
- B7H - 7BH

`7BH + B7H = 132H`, so the 8-bit addition has a carry-out. In the usual two's-complement ALU convention, subtraction sets carry when there is no borrow: `B7H - 7BH` has a carry-out, while `7BH - B7H` borrows.

**Answer: `7BH + B7H` and `B7H - 7BH` (A and C)**

## 4. Minimum high noise margin

**Question:** Consider the SN74LS348 priority encoder circuit given in [this link](https://www.ti.com/lit/ds/symlink/sn74ls348.pdf?ts=1730632391574), what is the minimum noise margin for High value? (answer example: 1.23 V)

The datasheet gives `VIH(min) = 2.0 V`. The lowest `VOH(min)` among the outputs is `2.4 V` for A0–A2. Thus `2.4 V - 2.0 V = 0.4 V`.

**Answer: `0.4 V`**

## 5. Maximum high noise margin

**Question:** Consider the SN74LS348 priority encoder circuit given in [this link](https://www.ti.com/lit/ds/symlink/sn74ls348.pdf?ts=1730632391574), what is the maximum noise margin for High value? (answer example: 1.23 V)

The largest typical high output listed is `VOH(typ) = 3.4 V` for EO/GS. Using `VIH(min) = 2.0 V` gives `3.4 V - 2.0 V = 1.4 V`.

**Likely expected answer: `1.4 V`**

**Datasheet caveat:** TI lists 3.4 V as typical, not as a guaranteed maximum `VOH`. Strictly, the datasheet does not define a guaranteed maximum noise margin. A value of `3.00 V` assumes `VOH(max) = 5 V`, which is not specified by the datasheet.

## 6. EI-to-EO high-to-low propagation delay

**Question:** Consider the SN74LS348 priority encoder circuit given in [this link](https://www.ti.com/lit/ds/symlink/sn74ls348.pdf?ts=1730632391574), what is the maximum high to low propagation delay from the input EI to the output EO? (answer example: 123 ns)

In the switching-characteristics table, the `tPHL` row for EI to EO has a maximum of 40 ns.

**Answer: `40 ns`**

## 7. Maximum rising time

**Question:** Consider the 74HC375A octal 3-state DFF circuit given in [this link](https://octopart.com/datasheet/mc74hc374adtg-onsemi-877976). Assuming VCC=3 V and temperature=20 degrees, give in ns, the maximum rising time (answer example: 123 ns).

The attached MC74HC374A datasheet lists a maximum input rise/fall time of 800 ns at `VCC = 3.0 V`. At 20°C, use the datasheet's −55°C to 25°C column.

**Answer: `800 ns`**

**Note:** The form says 74HC375A, but the linked/downloaded datasheet is for MC74HC374A.

## 8. Maximum clock-to-output propagation delay

**Question:** Consider the 74HC375A octal 3-state DFF circuit given in [this link](https://octopart.com/datasheet/mc74hc374adtg-onsemi-877976). Assuming VCC=3 V and temperature=20 degrees, give in ns, the maximum clock to output propagation delay (answer example: 123 ns).

For `VCC = 3.0 V` and 20°C, the MC74HC374A datasheet's maximum clock-to-Q propagation delay is 80 ns.

**Answer: `80 ns`**

## 9. Memory reads to fetch an instruction

**Question:** Consider the specifications of the Little- Endian (data and instructions) hypothetical machine given in example 1 of chapter 2 (slide 50). We assume an 8-bit data bus and the memory is byte addressable. How many memory reads are needed to fetch an instruction?

Each instruction is 16 bits (2 bytes), while each memory read transfers 8 bits (1 byte). Fetching one instruction therefore takes two reads.

**Answer: `2 memory reads`**

## 10. Memory reads to decode/execute an instruction

**Question:** Consider the specifications of the Little- Endian (data and instructions) hypothetical machine given in example 1 of chapter 2 (slide 50). We assume an 8-bit data bus and the memory is byte addressable. How many memory reads are needed to decode/execute an instruction?

Reading a 16-bit memory operand over an 8-bit bus takes two reads. The form asks about decode/execute separately from fetching the instruction.

**Answer: `2 memory reads`**

If counting the entire instruction cycle including instruction fetch, that would add two more reads; the separate execute-stage operand read is two.

## 11. Program size

**Question:** Consider the specifications of the Little-Endian (data and instructions) hypothetical machine given in example 1 of chapter 2 (slide 50). We assume an 8-bit data bus and the memory is byte addressable. Consider the following memory content:

`900H: 0A190C590E29007923456789ABCDEF01H`

Give the size of the program stored at address 900H.

The program contains four 16-bit instructions, ending with the halt instruction: `4 × 16 = 64` bits (8 bytes). The following bytes are data, not additional instructions.

**Answer: `64 bits`**

## 12. Address of the last instruction

**Question:** Consider the specifications of the Little-Endian (data and instructions) hypothetical machine given in example 1 of chapter 2 (slide 50). We assume an 8-bit data bus and the memory is byte addressable. Consider the following memory content:

`900H: 0A190C590E29007923456789ABCDEF01H`

Give the address of the last instruction of the program stored at address 900H (answer example: 12345H).

The instruction start addresses are `900H`, `902H`, `904H`, and `906H`. The last instruction starts at `906H`.

**Answer: `906H`**

## 13. IR after fetching the first instruction

**Question:** Consider the specifications of the Little-Endian (data and instructions) hypothetical machine given in example 1 of chapter 2 (slide 50). We assume an 8-bit data bus and the memory is byte addressable. Consider the following memory content:

`900H: 0A190C590E29007923456789ABCDEF01H`

Give the content of the register IR (Instruction Register) after fetching the first instruction (answer example: 12345H).

The first two bytes are `0A` at `900H` and `19` at `901H`. Little-endian ordering makes the instruction word `190AH`.

**Answer: `190AH`**

## 14. MBR after fetching the first instruction

**Question:** Consider the specifications of the Little-Endian (data and instructions) hypothetical machine given in example 1 of chapter 2 (slide 50). We assume an 8-bit data bus and the memory is byte addressable. Consider the following memory content:

`900H: 0A190C590E29007923456789ABCDEF01H`

Give the content of the register MBR (Memory Buffer Register) after fetching the first instruction (answer example: 12345H).

The last byte read during fetch is at `901H`, and its value is `19H`.

**Answer: `19H`**

## 15. PC after fetching the first instruction

**Question:** Consider the specifications of the Little-Endian (data and instructions) hypothetical machine given in example 1 of chapter 2 (slide 50). We assume an 8-bit data bus and the memory is byte addressable. Consider the following memory content:

`900H: 0A190C590E29007923456789ABCDEF01H`

Give the content of the register PC (Program Counter) after fetching the first instruction (answer example: 12345H).

Fetching two bytes advances the PC from `900H` to `902H`.

**Answer: `902H`**

## 16. MBR after executing the first instruction

**Question:** Consider the specifications of the Little-Endian (data and instructions) hypothetical machine given in example 1 of chapter 2 (slide 50). We assume an 8-bit data bus and the memory is byte addressable. Consider the following memory content:

`900H: 0A190C590E29007923456789ABCDEF01H`

Give the content of the register MBR after executing the first instruction (answer example: 12345H).

The first instruction, `190AH`, loads a 16-bit word from `90AH`. The bytes are `67H` at `90AH` and `89H` at `90BH`; after the second read, the MBR contains `89H`.

**Answer: `89H`**

## 17. MAR after executing the first instruction

**Question:** Consider the specifications of the Little-Endian hypothetical machine given in example 1 of chapter 2 (slide 50). We assume an 8-bit data bus and the memory is byte addressable. Consider the following memory content:

`900H: 0A190C590E29007923456789ABCDEF01H`

Give the content of the register MAR after executing the first instruction (answer example: 12345H).

The final byte of the operand is read from address `90BH`.

**Answer: `90BH`**

## 18. AC after executing the first instruction

**Question:** Consider the specifications of the Little-Endian hypothetical machine given in example 1 of chapter 2 (slide 50). We assume an 8-bit data bus and the memory is byte addressable. Consider the following memory content:

`900H: 0A190C590E29007923456789ABCDEF01H`

Give the content of the register AC after executing the first instruction (answer example: 12345H).

The first instruction loads the word at `90AH`. The low byte is `67H` and the high byte is `89H`, so the word is `8967H`.

**Answer: `8967H`**

## 19. AC after executing the last instruction

**Question:** Consider the specifications of the Little-Endian (data and instructions) hypothetical machine given in example 1 of chapter 2 (slide 50). We assume an 8-bit data bus and the memory is byte addressable. Consider the following memory content:

`900H: 0A190C590E29007923456789ABCDEF01H`

Give the content of the register AC after executing the last instruction (answer example: 12345H).

The first instruction loads `8967H`. The second instruction adds the little-endian word at `90CH`: bytes `ABH` and `CDH` form `CDABH`. Their sum is `15712H`; the 16-bit AC keeps the low 16 bits, `5712H`. The store and halt instructions do not change AC.

**Answer: `5712H`**

## Answers to revisit

- Q4: change `0.7 V` to `0.4 V`.
- Q5: `1.4 V` is the likely expected value under the typical-value convention; note the datasheet caveat above.
- Q10: if you selected “None of the above,” change it to “2 memory reads.”
