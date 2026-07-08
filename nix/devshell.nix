{
  perSystem =
    { pkgs, ... }:
    let
      # nodejs_24 ships npm >= 11.10, which enforces min-release-age (site/.npmrc)
      nodejs = pkgs.nodejs_24;
      nodeModules = pkgs.importNpmLock.buildNodeModules {
        npmRoot = ../site;
        inherit nodejs;
      };
    in
    {
      devShells.default = pkgs.mkShell {
        name = "wiki";
        buildInputs = [
          nodejs
          pkgs.markdownlint-cli2
          pkgs.marksman
        ];

        shellHook = ''
          ln -sfn ${nodeModules}/node_modules "$(${pkgs.git}/bin/git rev-parse --show-toplevel)/site/node_modules"
          echo "wiki dev environment (node_modules provided by nix)"
          echo "  cd site && npm run dev      - live preview at localhost:4321"
          echo "  cd site && npm run build    - static site to site/dist/"
          echo "  nix build                   - reproducible site build"
        '';
      };
    };
}
