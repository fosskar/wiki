{
  description = "henlo";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";

  outputs = {
    nixpkgs,
  }:
 let
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      devShell = pkgs.mkShell {
        name = "henlo";
        buildInputs = with pkgs; [
          gollum
        ];
      };
}
