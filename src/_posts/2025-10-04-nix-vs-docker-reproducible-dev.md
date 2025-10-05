---
title: 'Reproducible Dev Without Docker: Nix on macOS and Linux'
date: 2025-10-04
coverImage: "/assets/docker-nix-post/thumb.webp"
---

![Docker vs Nix](/assets/docker-nix-post/upscayl2/docker_whale_2_upscayl_2x_upscayl-standard-4x.webp)
*Docker made reproducible dev popular. Nix makes it native.*

## TL;DR

Docker popularized reproducible development with container images, but it often brings heavy images, non‑deterministic builds, and awkward “kitchen‑sink” tool stacks. Nix treats packages as immutable values under unique hashed paths, so multiple versions can coexist and all dependencies are explicitly declared. For day‑to‑day development, Nix dev shells replace launching an isolated kernel, avoiding virtualization overhead and making composition simpler.

Nix runs on macOS and Linux and integrates with the huge nixpkgs collection. You can share fully declarative dev environments via `shell.nix` or flakes. For day‑to‑day dev, prefer tracking `nixpkgs-unstable` and update on your schedule; pin nixpkgs only for CI or strict reproducibility. Auto‑activate shells with `direnv`. Docker is still excellent for deployment and isolation; for local development on non‑NixOS, Nix provides a cleaner, native alternative.

---

## Why developers outgrow Docker for dev

- Image overhead: large base images, layered rebuilds, slow iteration.
- Non‑determinism: `apt-get` without pinning, mutable OS state, drifting versions.
- Awkward composition: multi‑tool images become hard to maintain and reason about.

For dev, you often just want a predictable toolchain, fast startup, and the ability to mix versions without global conflicts. 

## How Nix models environments

- Immutable store: Everything lives under hashed paths like `/nix/store/<hash>-pkg-version`.
- Pure inputs: Hashes come from exact sources and build options; change inputs, get a new path.
- Coexistence: Multiple versions of the same tool can exist side‑by‑side without conflicts.
- Dev shells: Environments are composed by exporting environment variables (e.g., `PATH`) rather than running a containerized OS.

![Composing native toolchains](/assets/docker-nix-post/upscayl2/functional_factory_1_upscayl_2x_upscayl-standard-4x.webp)
*Compose precise toolchains without container overhead*

## The nixpkgs ecosystem and flakes

- Flakes: A modern, reproducible interface for pinning inputs and sharing outputs (dev shells, packages, apps).

You can use either classic `shell.nix` or flakes. Both work on macOS and Linux.

## Recommended: Track `nixpkgs-unstable` for dev shells

For day‑to‑day development, prefer `nixpkgs-unstable` so you get recent compilers and tools without chasing patches. With flakes, you still get a precise lock in `flake.lock`, and you can intentionally update with `nix flake update` when you’re ready. Reserve hard pinning to a specific nixpkgs commit for CI or long‑lived reproducibility guarantees.

```nix
# flake.nix (recommended for local dev)
{
  description = "Dev shell tracking nixpkgs-unstable (locked per repo)";

  # Track the unstable branch; the exact commit is recorded in flake.lock
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";

  outputs = { self, nixpkgs }:
    let
      forAllSystems = f: nixpkgs.lib.genAttrs [
        "aarch64-darwin" "x86_64-darwin" "aarch64-linux" "x86_64-linux"
      ] (system: f (import nixpkgs { inherit system; }));
    in {
      devShells = forAllSystems (pkgs: {
        default = pkgs.mkShell {
          packages = [ pkgs.nodejs_20 pkgs.git pkgs.direnv ];
          shellHook = ''
            export NODE_OPTIONS=--max_old_space_size=4096
            echo "Dev shell ready for ${pkgs.stdenv.hostPlatform.system}"
          '';
        };
      });
    };
}
```

Update to the latest tools when you choose:

```bash
nix flake update
```

## Option A: Classic `shell.nix` (pin only when needed)

```nix
# shell.nix
let
  # For fast local iteration, import your channel's nixpkgs (e.g., nixpkgs-unstable).
  # For strict reproducibility, replace with a specific commit tarball via fetchTarball.
  pkgs = import <nixpkgs> {};
in
pkgs.mkShell {
  packages = [
    pkgs.nodejs_20
    pkgs.git
    pkgs.direnv
  ];

  # Set any environment variables your tooling needs
  shellHook = ''
    export NODE_OPTIONS=--max_old_space_size=4096
    echo "Dev shell ready (Node 20, git, direnv)"
  '';
}
```

If you need bit‑for‑bit determinism (e.g., CI), pin nixpkgs by using a specific commit tarball (replace `<nixpkgs>` with `fetchTarball .../<rev>.tar.gz`).

## Option B: Flakes with `mkShell` (pinned commit for CI)

```nix
# flake.nix
{
  description = "Example dev shell (Node 20)";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/<rev>"; # hard pin for CI/repro

  outputs = { self, nixpkgs }:
    let
      forAllSystems = f: nixpkgs.lib.genAttrs [
        "aarch64-darwin" "x86_64-darwin" "aarch64-linux" "x86_64-linux"
      ] (system: f (import nixpkgs { inherit system; }));
    in {
      devShells = forAllSystems (pkgs: {
        default = pkgs.mkShell {
          packages = [ pkgs.nodejs_20 pkgs.git pkgs.direnv ];
          shellHook = ''
            export NODE_OPTIONS=--max_old_space_size=4096
            echo "Dev shell ready for ${pkgs.stdenv.hostPlatform.system}"
          '';
        };
      });
    };
}
```

Enable flakes (if not already) and drop into the shell:

```bash
# One-time (if flakes aren't enabled yet)
echo 'experimental-features = nix-command flakes' | sudo tee -a /etc/nix/nix.conf

# Enter the dev shell
nix develop
```

## Auto‑activation with direnv

Let the shell auto‑activate when you `cd` into the project.

```bash
# .envrc (flake-based)
use flake
```

Or, for classic `shell.nix`:

```bash
# .envrc (classic)
use_nix
```

Then allow once per directory:

```bash
direnv allow
```

## When to still use Docker

- Deployment packaging and isolation across hosts.
- Running services that expect Linux kernel features your host lacks.
- Security boundaries stronger than a userland dev shell.

For local development on macOS and Linux, Nix is typically leaner and more maintainable.

## Summary

- Nix dev shells give native, reproducible environments without container overhead.
- Prefer `nixpkgs-unstable` for local dev; pin nixpkgs only for CI or strict reproducibility.
- Declare all tools via `mkShell`, and add `direnv` for ergonomics.
