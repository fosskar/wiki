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

        npmDeps = pkgs.fetchNpmDeps {
          src = pkgs.lib.fileset.toSource {
            root = ../site;
            fileset = ../site/package-lock.json;
          };
          hash = "sha256-bMxrG76+KirsZs013ktFbDwCFqro+szTiqTGyxG4Ovs=";
        };

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
