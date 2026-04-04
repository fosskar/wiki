{
  description = "personal wiki";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        quartzVersion = "v4.5.2";

        wiki-setup = pkgs.writeShellScriptBin "wiki-setup" ''
          set -euo pipefail
          WIKI_ROOT="$(pwd)"
          SITE_DIR="$WIKI_ROOT/.site"

          if [ -d "$SITE_DIR/node_modules" ]; then
            echo "quartz already set up in .site/"
            echo "run wiki-serve or wiki-build"
            exit 0
          fi

          echo "setting up quartz ${quartzVersion}..."

          rm -rf "$SITE_DIR"
          ${pkgs.git}/bin/git clone --depth 1 --branch ${quartzVersion} \
            https://github.com/jackyzha0/quartz.git "$SITE_DIR"
          rm -rf "$SITE_DIR/.git"

          # copy our config into quartz project
          cp "$WIKI_ROOT/quartz.config.ts" "$SITE_DIR/quartz.config.ts"
          cp "$WIKI_ROOT/quartz.layout.ts" "$SITE_DIR/quartz.layout.ts"
          cp "$WIKI_ROOT/custom.scss" "$SITE_DIR/quartz/styles/custom.scss"

          # apply patches
          cp "$WIKI_ROOT/patches/toc.inline.ts" "$SITE_DIR/quartz/components/scripts/toc.inline.ts"
          cp "$WIKI_ROOT/patches/Footer.tsx" "$SITE_DIR/quartz/components/Footer.tsx"

          # install npm deps
          cd "$SITE_DIR"
          npm ci 2>&1 | tail -5

          echo ""
          echo "quartz ready. run wiki-serve or wiki-build"
        '';

        wiki-serve = pkgs.writeShellScriptBin "wiki-serve" ''
          set -euo pipefail
          WIKI_ROOT="$(pwd)"
          SITE_DIR="$WIKI_ROOT/.site"

          if [ ! -d "$SITE_DIR/node_modules" ]; then
            echo "run wiki-setup first"
            exit 1
          fi

          # refresh config
          cp "$WIKI_ROOT/quartz.config.ts" "$SITE_DIR/quartz.config.ts"
          cp "$WIKI_ROOT/quartz.layout.ts" "$SITE_DIR/quartz.layout.ts"
          cp "$WIKI_ROOT/custom.scss" "$SITE_DIR/quartz/styles/custom.scss"
          cp "$WIKI_ROOT/patches/toc.inline.ts" "$SITE_DIR/quartz/components/scripts/toc.inline.ts"
          cp "$WIKI_ROOT/patches/Footer.tsx" "$SITE_DIR/quartz/components/Footer.tsx"

          cd "$SITE_DIR"
          npx quartz build --serve --directory "$WIKI_ROOT"
        '';

        wiki-build = pkgs.writeShellScriptBin "wiki-build" ''
          set -euo pipefail
          WIKI_ROOT="$(pwd)"
          SITE_DIR="$WIKI_ROOT/.site"

          if [ ! -d "$SITE_DIR/node_modules" ]; then
            echo "run wiki-setup first"
            exit 1
          fi

          # refresh config
          cp "$WIKI_ROOT/quartz.config.ts" "$SITE_DIR/quartz.config.ts"
          cp "$WIKI_ROOT/quartz.layout.ts" "$SITE_DIR/quartz.layout.ts"
          cp "$WIKI_ROOT/custom.scss" "$SITE_DIR/quartz/styles/custom.scss"
          cp "$WIKI_ROOT/patches/toc.inline.ts" "$SITE_DIR/quartz/components/scripts/toc.inline.ts"
          cp "$WIKI_ROOT/patches/Footer.tsx" "$SITE_DIR/quartz/components/Footer.tsx"

          cd "$SITE_DIR"
          npx quartz build --directory "$WIKI_ROOT" --output "$WIKI_ROOT/public"

          echo ""
          echo "static site built to $WIKI_ROOT/public/"
        '';
        # only markdown content, no config/patches/flake files
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
          version = "0.1.0";

          src = quartz-src;

          npmDepsHash = "sha256-xxK9qy04m1olekOJIyYJHfdkYFzpjsgcfyFPuKsHpKE=";

          # copy our config + patches into quartz source
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
        };

        devShell = pkgs.mkShell {
          name = "wiki";
          buildInputs = with pkgs; [
            nodejs_22
            markdownlint-cli2
            marksman
            wiki-setup
            wiki-serve
            wiki-build
          ];

          shellHook = ''
            echo "wiki dev environment"
            echo "  wiki-setup  - initialize quartz (run once)"
            echo "  wiki-serve  - live preview at localhost:8080"
            echo "  wiki-build  - build static site to public/"
          '';
        };
      in
      {
        packages.default = site;

        checks = {
          build = site;
          devshell = devShell;
        };

        devShells.default = devShell;
      }
    );
}
