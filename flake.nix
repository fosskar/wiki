{
  description = "personal wiki";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          name = "wiki";
          buildInputs = with pkgs; [
            # markdown linting and formatting
            markdownlint-cli2
            marksman  # markdown language server
            
            # optional: static site generation
            mdbook
          ];
          
          shellHook = ''
            echo "📝 wiki development environment"
            echo "available commands:"
            echo "  markdownlint-cli2 **/*.md  - lint all markdown files"
            echo "  mdbook serve                - serve as static site (if you add book.toml)"
          '';
        };
      }
    );
}
