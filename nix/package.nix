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
    in
    {
      packages.default = pkgs.buildNpmPackage {
        pname = "wiki";
        version = "0.1.0";

        src = astroSrc;
        sourceRoot = "${astroSrc.name}/site";

        # hash-free: every tarball is pinned by the integrity hashes
        # already committed in package-lock.json
        npmDeps = pkgs.importNpmLock { npmRoot = ../site; };
        npmConfigHook = pkgs.importNpmLock.npmConfigHook;

        env.ASTRO_TELEMETRY_DISABLED = "1";

        buildPhase = ''
          runHook preBuild
          npm run build
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
