# Inelec L05 — Computer Architecture

A collaborative study hub for EE321 Computer Architecture. The goal is to build
understanding from the digital-design foundations through the CPU topics currently
covered in the supplied course material, then verify it by solving past controls
without relying on answer keys.

## Study path

1. Digital-design review: number representation, logic, combinational/sequential
   circuits, ALU, and tri-state buses.
2. Top-level computer: CPU, memory, I/O, buses, instructions, and performance.
3. CPU: register organization, instruction execution, stacks, interrupts, and
   processor examples.

The course-material folder currently contains slides through Chapter 3 (CPU).
The instructor's course outline lists Control Unit as Chapter 4; we will add it
when it is in scope and its material is available.

## What belongs here

- Original explanations, worked examples, and practice questions.
- Original HTML/SVG visualizations made for studying.
- A topic map and references to the official course sources.

## Start here

- **[Full interactive study site](../docs/index.html)** — follows the professor's
  slides Chapter 1 → 2 → 3, with visualizations and past-control practice.
- [Lesson 1 — Bits, bytes, binary, and hexadecimal](lessons/01-digital-foundations.md)
- [Interactive binary-byte lab](visuals/01-binary-byte-lab.html)

### Running the site locally

```bash
cd docs
python3 -m http.server 8000
# then open http://localhost:8000
```

No build step and no external dependencies. The site can also be published with
GitHub Pages using the `docs/` folder.

Official lecture slides, textbooks, exam scans/answer keys, and quiz exports are
not copied into this repository. Please obtain course materials through their
authorized source. Quiz exports can contain personal response data.

## Collaboration

Open an issue or pull request for a correction, a clearer explanation, or an
original practice problem. Show the reasoning, not only the final answer.
