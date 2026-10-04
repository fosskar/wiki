{ inputs, ... }:
let
  pkgs = inputs.nixpkgs.legacyPackages.x86_64-linux;
  inherit (inputs.nixbot.lib.effects { inherit pkgs; }) mkEffect;
in
{
  flake.herculesCI = _args: {
    onSchedule.update-flake-inputs = {
      when = {
        hour = 21;
        minute = 0;
      };
      # nixbot mounts a pushable clone of the effect's commit at
      # $NIXBOT_EFFECT_CHECKOUT, which is also the working directory. The
      # updater lives in the nixfiles flake; no flake input required.
      outputs.effects.update-flake-inputs = mkEffect {
        name = "effect-update-flake-inputs";
        checkout = true;
        inputs = [ pkgs.nix ];
        secretsMap.git.type = "GitToken";
        effectScript = ''
          nix --extra-experimental-features 'nix-command flakes' \
            run github:fosskar/nixfiles#updater-effect -- flake-inputs
        '';
      };
    };
  };
}
