# Flake templates

templates = import "${self}/templates" { inherit self; };

use self to reference the flake itself. so you can reference you templates with self like this:

nix flake init -t self#templates.<name-of-template>

this creates the specified template in the current directory.

