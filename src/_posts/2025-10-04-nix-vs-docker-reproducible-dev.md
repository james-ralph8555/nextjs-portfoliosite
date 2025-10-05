---
title: 'Reproducible Dev Without Docker: Nix on macOS and Linux'
date: 2025-10-04
coverImage: "/assets/docker-nix-post/thumb.webp"
---

![Docker vs Nix](/assets/docker-nix-post/upscayl2/docker_whale_2_upscayl_2x_upscayl-standard-4x.webp)
*Docker made reproducible dev popular. Nix makes it native.*

## Overview

Docker popularized reproducible development with container images, but it often brings heavy images, non‑deterministic builds, and awkward “kitchen‑sink” tool stacks. Nix treats packages as immutable values under unique hashed paths, so multiple versions can coexist and all dependencies are explicitly declared. For day‑to‑day development, Nix dev shells replace launching an isolated kernel, avoiding virtualization overhead and making composition simpler.

Nix runs on macOS and Linux and integrates with the huge nixpkgs collection. You can share fully declarative dev environments via flakes. For day‑to‑day dev, prefer tracking `nixpkgs-unstable` and update on your schedule; pin nixpkgs only for CI or strict reproducibility. Auto‑activate shells with `direnv`. Docker is still excellent for deployment and isolation; for local development on non‑NixOS, Nix provides a cleaner, native alternative.

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
- Dev shells: Environments are composed by exporting environment variables (e.g., `PATH`) that point to packages in the Nix store, rather than running a containerized OS. The shell simply adjusts your environment to include the specified tools while keeping you on your native host system.

![Composing native toolchains](/assets/docker-nix-post/upscayl2/functional_factory_1_upscayl_2x_upscayl-standard-4x.webp)
*Compose precise toolchains without container overhead*

## The nixpkgs ecosystem and flakes

- Flakes: A modern, reproducible interface for pinning inputs and sharing outputs (dev shells, packages, apps).

Flakes provide a uniform structure for Nix projects, allow pinning specific versions of dependencies, and share these dependencies via lock files. They make it more convenient to write reproducible Nix expressions.

## Flake Examples for Development Shells

All examples use `mkShell` from nixpkgs to create development environments. While flakes provide the structure and dependency management, `mkShell` is the function that actually builds the development shell with your specified packages and environment variables.

### Example 1: Tracking nixpkgs-unstable (Recommended for Local Dev)

For day‑to‑day development, prefer `nixpkgs-unstable` so you get recent compilers and tools without chasing patches. With flakes, you still get a precise lock in `flake.lock`, and you can intentionally update with `nix flake update` when you're ready.

```nix
# flake.nix (recommended for local dev - Linux x86_64)
{
  description = "Dev shell tracking nixpkgs-unstable for Linux x86_64";

  # Track the unstable branch; the exact commit is recorded in flake.lock
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      devShells.${system}.default = pkgs.mkShell {
        packages = [ pkgs.nodejs_20 pkgs.git pkgs.direnv ];
        shellHook = ''
          export NODE_OPTIONS=--max_old_space_size=4096
          echo "Dev shell ready for ${system} (unstable)"
        '';
      };
    };
}
```

Update to the latest tools when you choose:

```bash
nix flake update
```

### Example 2: Pinned to a Specific Version (For CI/Reproducibility)

For CI or strict reproducibility guarantees, pin nixpkgs to a specific commit:

```nix
# flake.nix (pinned for CI/reproducibility - macOS Darwin)
{
  description = "Dev shell pinned to specific nixpkgs commit for macOS";

  # Hard pin to a specific commit for bit-for-bit reproducibility
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/24.05";

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-darwin";
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      devShells.${system}.default = pkgs.mkShell {
        packages = [ pkgs.nodejs_20 pkgs.git pkgs.direnv ];
        shellHook = ''
          export NODE_OPTIONS=--max_old_space_size=4096
          echo "Dev shell ready for ${system} (pinned)"
        '';
      };
    };
}
```

### Example 3: Using GitHub Dependencies

Flakes make it easy to depend on other GitHub repositories that provide flake outputs:

```nix
# flake.nix (with GitHub dependency - Linux x86_64)
{
  description = "Dev shell with GitHub dependency for Linux";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    # Example: Using a tool from another GitHub repository
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, rust-overlay }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs {
        inherit system;
        overlays = [ rust-overlay.overlays.default ];
      };
    in {
      devShells.${system}.default = pkgs.mkShell {
        packages = [ 
          pkgs.nodejs_20 
          pkgs.git 
          pkgs.direnv
          # Rust from the overlay - provides latest stable Rust
          pkgs.rust-bin.stable.latest.default 
        ];
        shellHook = ''
          export NODE_OPTIONS=--max_old_space_size=4096
          echo "Dev shell ready for ${system} with Rust from overlay"
        '';
      };
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

Update to the latest tools when you choose:

```bash
nix flake update
```



## Auto‑activation with direnv

Let the shell auto‑activate when you `cd` into the project.

```bash
# .envrc (flake-based)
use flake
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

## Key Takeaways

- Nix dev shells give native, reproducible environments without container overhead.
- Flakes provide a modern, reproducible interface with automatic locking and dependency management.
- Use `nixpkgs-unstable` for local development, pin to specific versions for CI, and easily include GitHub dependencies.
- Declare all tools via `mkShell`, and add `direnv` for ergonomics.
