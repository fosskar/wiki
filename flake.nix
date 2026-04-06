{
  description = "personal wiki";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";

    systems.url = "github:nix-systems/default";

    flake-parts = {
      url = "github:hercules-ci/flake-parts";
      inputs.nixpkgs-lib.follows = "nixpkgs";
    };

    treefmt-nix = {
      url = "github:numtide/treefmt-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    inputs@{ flake-parts, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = import inputs.systems;

      imports = [
        inputs.treefmt-nix.flakeModule
      ];

      perSystem =
        {
          pkgs,
          config,
          self',
          ...
        }:
        let
          quartzVersion = "v4.5.2";

          syncOverrides = ''
            cp "$WIKI_ROOT/quartz.config.ts" "$SITE_DIR/quartz.config.ts"
            cp "$WIKI_ROOT/quartz.layout.ts" "$SITE_DIR/quartz.layout.ts"
            cp "$WIKI_ROOT/custom.scss" "$SITE_DIR/quartz/styles/custom.scss"
            cp "$WIKI_ROOT/patches/toc.inline.ts" "$SITE_DIR/quartz/components/scripts/toc.inline.ts"
            cp "$WIKI_ROOT/patches/Footer.tsx" "$SITE_DIR/quartz/components/Footer.tsx"
          '';

          wiki = pkgs.writeShellScriptBin "wiki" ''
            set -euo pipefail
            WIKI_ROOT="$(pwd)"
            SITE_DIR="$WIKI_ROOT/.site"

            setup() {
              if [ -d "$SITE_DIR/node_modules" ]; then
                echo "quartz already set up in .site/"
                return
              fi
              echo "setting up quartz ${quartzVersion}..."
              rm -rf "$SITE_DIR"
              ${pkgs.git}/bin/git clone --depth 1 --branch ${quartzVersion} \
                https://github.com/jackyzha0/quartz.git "$SITE_DIR"
              rm -rf "$SITE_DIR/.git"
              ${syncOverrides}
              cd "$SITE_DIR" && npm ci 2>&1 | tail -5
            }

            case "''${1:-}" in
              serve)
                setup
                ${syncOverrides}
                cd "$SITE_DIR" && npx quartz build --serve --directory "$WIKI_ROOT"
                ;;
              build)
                setup
                ${syncOverrides}
                cd "$SITE_DIR" && npx quartz build --directory "$WIKI_ROOT" --output "$WIKI_ROOT/public"
                echo "static site built to $WIKI_ROOT/public/"
                ;;
              *)
                echo "usage: wiki <serve|build>"
                exit 1
                ;;
            esac
          '';

          content = pkgs.lib.cleanSourceWith {
            src = ./.;
            filter =
              path: type:
              let
                baseName = baseNameOf path;
              in
              (
                type == "directory"
                && !builtins.elem baseName [
                  ".site"
                  "public"
                  "patches"
                  "result"
                  ".jj"
                  ".git"
                ]
              )
              || pkgs.lib.hasSuffix ".md" baseName;
          };

          quartz-src = pkgs.fetchFromGitHub {
            owner = "jackyzha0";
            repo = "quartz";
            rev = quartzVersion;
            hash = "sha256-A6ePeNmcsbtKVnm7hVFOyjyc7gRYvXuG0XXQ6fvTLEw=";
          };

          site = pkgs.buildNpmPackage {
            pname = "wiki";
            version = "4.5.2";

            src = quartz-src;

            npmDepsHash = "sha256-xxK9qy04m1olekOJIyYJHfdkYFzpjsgcfyFPuKsHpKE=";

            postPatch = ''
              cp ${./quartz.config.ts} quartz.config.ts
              cp ${./quartz.layout.ts} quartz.layout.ts
              cp ${./custom.scss} quartz/styles/custom.scss
              cp ${./patches/toc.inline.ts} quartz/components/scripts/toc.inline.ts
              cp ${./patches/Footer.tsx} quartz/components/Footer.tsx
            '';

            buildPhase = ''
              node ./quartz/bootstrap-cli.mjs build --directory ${content} --output $out
            '';

            dontInstall = true;

            passthru.updateScript = {
              command = [
                "nix-update"
                "--flake"
                "--version-regex"
                "v(4\\.\\d+\\.\\d+)"
                "default"
              ];
              supportedFeatures = [ "commit" ];
            };
          };
        in
        {
          packages.default = site;

          devShells.default = pkgs.mkShell {
            name = "wiki";
            buildInputs = with pkgs; [
              nodejs_22
              markdownlint-cli2
              marksman
              wiki
            ];

            shellHook = ''
              echo "wiki dev environment"
              echo "  wiki serve  - live preview at localhost:8080"
              echo "  wiki build  - build static site to public/"
            '';
          };

          treefmt = {
            projectRootFile = "flake.nix";
            settings.global.excludes = [
              "*.gitignore"
              ".site"
              ".site/**"
              "public"
              "public/**"
              "result"
              "**/result"
              "flake.lock"
              "patches/**"
            ];
            programs = {
              nixfmt.enable = true;
              prettier.enable = true;
            };
          };

          checks =
            let
              packages = builtins.mapAttrs (_: pkg: pkg) (self'.packages or { });
              devShells = builtins.mapAttrs (_: shell: shell) (self'.devShells or { });
            in
            packages // devShells;

          formatter = config.treefmt.build.wrapper;
        };
    };
}
