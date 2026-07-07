{ inputs, ... }:
let
  pkgs = inputs.nixpkgs.legacyPackages.x86_64-linux;

  forgeHost = "github.com";
  repo = "fosskar/wiki";

  # Same plumbing as nixfiles' mkRepoEffect: request nixbot's forge token
  # (GitToken), clone with it, run command. git redacts credentials from URLs
  # in its output, so the token stays out of the public effect log.
  mkRepoEffect =
    name: command:
    pkgs.runCommand "effect-${name}"
      {
        nativeBuildInputs = [
          pkgs.cacert
          pkgs.git
          pkgs.jq
          pkgs.nix
        ];
        secretsMap = builtins.toJSON {
          git.type = "GitToken";
          github = "github-api";
        };
        HOME = "/build";
      }
      ''
        set -euo pipefail
        token=$(jq -re '.git.data.token' "$HERCULES_CI_SECRETS_JSON")
        export FORGE_TOKEN="$token"
        github_token=$(jq -re '.github.data.token' "$HERCULES_CI_SECRETS_JSON")
        export GITHUB_TOKEN="$github_token"
        export NIX_CONFIG="experimental-features = nix-command flakes
        access-tokens = github.com=$github_token"

        git config --global user.name nixbot
        git config --global user.email nixbot@nx3.eu
        git config --global safe.directory '*'

        git clone --depth 1 --progress "https://oauth2:$token@${forgeHost}/${repo}.git" repo
        cd repo

        ${command}
      '';
in
{
  flake.effects = _args: {
    onSchedule.update-flake-inputs = {
      when = {
        hour = 5;
        minute = 0;
      };
      # updater lives in the nixfiles flake; no flake input required
      outputs.effects.update-flake-inputs = mkRepoEffect "update-flake-inputs" ''
        nix run "git+https://codeberg.org/fosskar/nixfiles?shallow=1#updater-flake-inputs"
      '';
    };
  };
}
