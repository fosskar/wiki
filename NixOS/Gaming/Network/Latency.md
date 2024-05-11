## NETEM

### no delay
```shell
tc qdisc del dev enp14s0 root netem
```

### add delay
```shell
tc qdisc add dev enp14s0 root netem delay 20ms
```

### increase delay
```shell
tc qdisc change dev enp14s0 root netem delay 20ms
```