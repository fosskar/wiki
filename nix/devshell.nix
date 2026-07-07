{
  perSystem =
    { pkgs, ... }:
    {
      devShells.default = pkgs.mkShell {
        name = "wiki";
        buildInputs = with pkgs; [
          nodejs_22
          markdownlint-cli2
          marksman
        ];

        shellHook = ''
          echo "wiki dev environment"
          echo "  cd site && npm run dev      - live preview at localhost:4321"
          echo "  cd site && npm run build    - static site to site/dist/"
          echo "  nix build                   - reproducible site build"
        '';
      };
    };
}
