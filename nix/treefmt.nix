{
  perSystem =
    { config, ... }:
    {
      treefmt = {
        projectRootFile = "flake.nix";
        settings.global.excludes = [
          "*.gitignore"
          "site/dist"
          "site/dist/**"
          "result"
          "**/result"
          "flake.lock"
        ];
        programs = {
          nixfmt.enable = true;
          prettier.enable = true;
        };
      };

      formatter = config.treefmt.build.wrapper;
    };
}
