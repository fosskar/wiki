# Minikube

## Run minikube with podman

minikube delete
minikube config set rootless true
minikube start --driver=podman --container-runtime=cri-o
