# yubikey pam u2f origin

when configuring `pam_u2f` for yubikey authentication in nixos, it's crucial to understand the `origin` parameter. this parameter is a security feature of the u2f/fido2 protocol that prevents a malicious service from impersonating a legitimate service and tricking you into authenticating with your yubikey.

## understanding origin vs appid

the `origin` and `appid` are related but distinct parameters in u2f authentication:

- **origin**: identifies the service making the authentication request (what you're logging into)
- **appid**: identifies the application or service that registered the key (legacy u2f parameter)

for pam authentication, both typically use the same value.

## the `origin` parameter in `pamu2fcfg`

the `pamu2fcfg` command is used to generate the u2f credentials file that is used by the `pam_u2f` module. when you generate this file, you need to specify the same origin that is configured in your `security.pam.u2f.settings` in your nixos configuration.

the `-o` parameter in the `pamu2fcfg` command is used to specify the origin. for example:

```bash
pamu2fcfg -u <username> -o pam://yubikey > u2f_keys
```

in this example, the origin is set to `pam://yubikey`.

**note**: you can also specify the appid with `-i` if needed:

```bash
pamu2fcfg -u <username> -o pam://yubikey -i pam://yubikey > u2f_keys
```

## matching the origin in your nixos configuration

the origin that you specify with the `-o` parameter in the `pamu2fcfg` command must match the `origin` that is configured in your `security.pam.u2f.settings` in your nixos configuration.

here is an example of how to configure the `origin` in your `u2f.nix` file:

```nix
security.pam = {
  u2f = {
    enable = true;
    control = "sufficient";  # or "required" for multi-factor auth
    settings = {
      origin = "pam://yubikey";
      appid = "pam://yubikey";  # typically same as origin
      cue = true;  # show reminder message to use u2f device
      # authfile = "/etc/u2f_keys";  # optional: custom key file location
    };
  };
  # ...
};
```

if the origins don't match, the authentication will fail.

## control options

the `control` parameter determines how u2f authentication integrates with other authentication methods:

- `"sufficient"`: u2f can be used instead of password (fallback to password if u2f fails)
- `"required"`: u2f must succeed (for multi-factor authentication with password + u2f)
- `"requisite"`: u2f must succeed, failure terminates auth process
- `"optional"`: u2f success/failure doesn't affect overall auth result

## default origin

if you don't specify an origin with the `-o` parameter, `pamu2fcfg` will use the default origin, which is `pam://<hostname>`. this will likely not match the origin that is configured in your nixos configuration, so it's important to always specify the origin explicitly.

## troubleshooting

common issues when setting up u2f authentication:

- **authentication fails silently**: check that origin values match exactly between `pamu2fcfg` and nixos config
- **no prompt to use u2f device**: set `cue = true;` in your pam settings
- **key file not found**: verify the `authfile` path exists and is readable by the system
- **hostname-dependent setup**: using default origins ties authentication to specific machines - use custom origins like `pam://yubikey` for portability
