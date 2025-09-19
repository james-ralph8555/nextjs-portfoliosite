{
  description = "A Next.js portfolio site";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in {
        devShells.default = pkgs.mkShell {
          name = "nextjs-portfoliosite-dev-shell";

          packages = with pkgs; [
            # Web development dependencies
            nodejs_20

            # Editor integration for better DX
            nodePackages.typescript-language-server
            vscode-langservers-extracted
          ];
        };
      });
}
