# opnsense networking setup

## overview

opnsense router configuration for kubernetes cluster networking with cilium load balancing.

## proxmox vm configuration

### network topology

use single vmbr1 bridge with vlan separation:

```
intel nic → vmbr1 (vlan-aware)
├── opnsense net0: no vlan tag (wan - 192.168.10.101)
├── opnsense net1: vlan 101 (lan - 10.10.10.1/24)
├── vm1: vlan 101 (10.10.10.x)
├── vm2: vlan 102 (10.20.20.x)
└── vm3: vlan 103 (10.30.30.x)
```

### vm settings

- **storage**: ufs filesystem (lighter than zfs for firewall appliances)
- **memory**: 2-4gb recommended
- **cpu**: 2-4 cores
- **network interfaces**:
  - net0: bridge vmbr1, no vlan tag (wan)
  - net1: bridge vmbr1, vlan tag 101 (lan)

## wan interface configuration

### private network setup

when opnsense wan connects to private network (not true internet):

**interfaces → wan → block private networks**: ❌ disable
**interfaces → wan → block bogon networks**: ❌ disable

these blocks prevent legitimate private network traffic (192.168.x.x) from reaching opnsense.

### static ip assignment

set wan interface to static ip to prevent dhcp conflicts:

```
interfaces → wan
type: static ipv4
ipv4 address: 192.168.10.101/24
ipv4 upstream gateway: 192.168.10.1
```

### web ui access from wan

by default, opnsense blocks web ui access from wan interface.

**system → settings → administration**:

- **listen interfaces**: all (allows wan access)
- **protocol**: http+https or https only

**firewall → rules → wan**:
add rule to allow web ui access:

- action: pass
- protocol: tcp
- source: 192.168.10.0/24 (your home network)
- destination: wan address (192.168.10.101)
- destination port: 80,443 (http/https)
- **gateway**: default (disable reply-to)

### critical: disable reply-to

**firewall → rules → wan** → edit web ui rule → advanced options:

- **gateway**: set to "default" instead of automatic
- **reply-to**: disable

this prevents asymmetric routing issues when accessing opnsense from same network segment as wan interface.

## troubleshooting

### wan web ui access issues

**problem**: cannot access opnsense web ui from home network even with correct firewall rules

**common causes**:

1. **reply-to forcing traffic through wrong gateway**
   - solution: disable reply-to in wan firewall rule
   - set gateway to "default" instead of automatic

2. **private network blocking enabled**
   - solution: disable "block private networks" on wan interface
   - disable "block bogon networks" on wan interface

3. **dhcp ip conflicts**
   - problem: opnsense gets router's ip (192.168.10.1)
   - solution: set wan interface to static ip (192.168.10.101)

4. **web configurator not listening on wan**
   - solution: set "listen interfaces" to "all" in system → settings → administration

**diagnostic steps**:

```bash
# test basic connectivity
ping 192.168.10.101

# check firewall logs
# interfaces should show blocks for wrong ports (http vs https)
# no logs for https = traffic allowed but no response

# verify static ip assignment
# opnsense dashboard should show correct wan ip
```

### vlan configuration verification

**check vm network assignment**:

- vm should get 10.10.10.x ip when vlan 101 assigned
- internet access should work through opnsense
- vm can access opnsense web ui at 10.10.10.1

**add additional vlans**:

- create new vlan interface in opnsense (interfaces → other types → vlan)
- assign vlan tag (102, 103, etc.)
- configure dhcp server for each vlan
- add inter-vlan firewall rules as needed

## dns configuration

### lan domain

use `.lan` domain for local services to avoid public dns conflicts:

- `hubble.kube-prd.lan`
- `grafana.kube-prd.lan`
- `argocd.kube-mgmt.lan`

### dns entries

create dns host override entries in opnsense:

1. **services → unbound dns → host overrides**
2. add entries for each service:
   - host: `hubble`
   - domain: `kube-prd.lan`
   - ip: `10.10.10.120` (cilium loadbalancer ip)

### wildcard dns (alternative)

create single wildcard entry:

- host: `*`
- domain: `kube-prd.lan`
- ip: `10.10.10.120`

allows automatic resolution of any `*.kube-prd.lan` subdomain.

## network segments

### management network

- `10.10.10.0/24`
- vlan 10
- cluster api management cluster
- proxmox hosts

### production network

- `10.10.10.0/24` (same segment)
- production kubernetes clusters
- shared with management for simplicity

## firewall rules

### kubernetes api access

allow port 6443 for kubernetes api:

- source: admin networks
- destination: kubernetes vip addresses
- port: 6443/tcp

### cilium ingress

allow http/https for ingress:

- source: lan networks
- destination: cilium loadbalancer ips
- ports: 80/tcp, 443/tcp

### inter-cluster communication

allow cluster-to-cluster communication:

- source: kubernetes networks
- destination: kubernetes networks
- ports: any (or restrict as needed)

## load balancer integration

### cilium l2 announcements

cilium announces loadbalancer ips via l2:

- no bgp configuration needed
- works on flat network segments
- automatic failover between nodes

### ip allocation

reserve ip ranges for cilium:

- `10.10.10.120-10.10.10.129` for loadbalancer services
- configure in dhcp server exclusions
- document in network inventory
