# opnsense networking setup

## overview
opnsense router configuration for kubernetes cluster networking with cilium load balancing.

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
