{
  perSystem =
    { self', ... }:
    {
      checks =
        let
          packages = builtins.mapAttrs (_: pkg: pkg) (self'.packages or { });
          devShells = builtins.mapAttrs (_: shell: shell) (self'.devShells or { });
        in
        packages // devShells;
    };
}
