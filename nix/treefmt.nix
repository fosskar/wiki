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
          prettier = {
            enable = true;
            # never reformat code inside markdown fences; it mangles
            # non-yaml syntax like helm's {{ .Values.name }}
            settings.embeddedLanguageFormatting = "off";
          };
        };
      };

      formatter = config.treefmt.build.wrapper;
    };
}
