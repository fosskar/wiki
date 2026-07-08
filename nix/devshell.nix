{
  perSystem =
    { pkgs, self', ... }:
    {
      devShells.default = pkgs.mkShell {
        name = "wiki";
        buildInputs = with pkgs; [
          nodejs_22
          pnpm
          markdownlint-cli2
          marksman
        ];

        shellHook = ''
          ln -sfn ${self'.packages.node-modules}/node_modules site/node_modules
          echo "wiki dev environment (node_modules provided by nix)"
          echo "  cd site && pnpm run dev     - live preview at localhost:4321"
          echo "  cd site && pnpm run build   - static site to site/dist/"
          echo "  nix build                   - reproducible site build"
        '';
      };
    };
}
