{
  perSystem =
    { pkgs, ... }:
    let
      astroSrc = pkgs.lib.fileset.toSource {
        root = ../.;
        fileset = pkgs.lib.fileset.unions [
          (pkgs.lib.fileset.difference ../site (
            pkgs.lib.fileset.unions [
              (pkgs.lib.fileset.maybeMissing ../site/node_modules)
              (pkgs.lib.fileset.maybeMissing ../site/dist)
            ]
          ))
          ../blog
          ../projects
          ../wiki
        ];
      };

      pnpmDeps = pkgs.fetchPnpmDeps {
        pname = "wiki-deps";
        version = "0.1.0";
        src = pkgs.lib.fileset.toSource {
          root = ../site;
          fileset = pkgs.lib.fileset.unions [
            ../site/package.json
            ../site/pnpm-lock.yaml
            ../site/pnpm-workspace.yaml
          ];
        };
        fetcherVersion = 3;
        hash = "sha256-lenBUi+Tpx5vrPV5x5wT/Iq9yywD4ACd9EDwi5yrGqg=";
      };

      nodeModules = pkgs.stdenv.mkDerivation {
        pname = "wiki-node-modules";
        version = "0.1.0";
        src = pnpmDeps.src;
        nativeBuildInputs = [
          pkgs.nodejs_22
          pkgs.pnpm
          pkgs.pnpmConfigHook
        ];
        inherit pnpmDeps;
        installPhase = ''
          runHook preInstall
          mkdir $out
          cp -r node_modules $out/node_modules
          runHook postInstall
        '';
      };
    in
    {
      packages.node-modules = nodeModules;

      packages.default = pkgs.stdenv.mkDerivation {
        pname = "wiki";
        version = "0.1.0";

        src = astroSrc;
        sourceRoot = "${astroSrc.name}/site";

        nativeBuildInputs = [
          pkgs.nodejs_22
          pkgs.pnpm
          pkgs.pnpmConfigHook
        ];
        inherit pnpmDeps;

        env.ASTRO_TELEMETRY_DISABLED = "1";

        buildPhase = ''
          runHook preBuild
          pnpm run build
          runHook postBuild
        '';

        installPhase = ''
          runHook preInstall
          cp -r dist $out
          runHook postInstall
        '';
      };
    };
}
