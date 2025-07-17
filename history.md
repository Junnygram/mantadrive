ubuntu@ip-172-31-85-211:~/mantadrive$ history
1 docker ps
2 ls
3 # Add Docker's official GPG key:
4 sudo apt-get update
5 sudo apt-get install ca-certificates curl
6 sudo install -m 0755 -d /etc/apt/keyrings
7 sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
8 sudo chmod a+r /etc/apt/keyrings/docker.asc
9 # Add the repository to Apt sources:
10 echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
 $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
11 sudo apt-get update rjbhdgdhbubd3ebdi3kels
12 docker ps
13 ls
14 sudo apt update
15 mkdir -p ~/.docker/cli-plugins/
16 curl -SL https://github.com/docker/compose/releases/download/v2.24.6/docker-compose-linux-x86_64 -o ~/.docker/cli-plugins/docker-compose
17 chmod +x ~/.docker/cli-plugins/docker-compose
18 git clone https://github.com/Junnygram/mantadrive.git
19 cd mantadrive
20 ls
21 nano .env
22 cd frontend
23 nano Dockerfile
24 cd ..
25 cd backend
26 ls
27 nano Dockerfile
28 docker-compose up --build -d
29 ls
30 cd ..
31 docker-compose up --build -d
32 mkdir -p ~/.docker/cli-plugins/
33 curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o ~/.docker/cli-plugins/docker-compose
34 chmod +x ~/.docker/cli-plugins/docker-compose
35 docker compose version
36 sudo apt update
37 sudo apt install -y docker.io
38 sudo systemctl enable docker
39 sudo systemctl start docker
40 docker --version
41 docker-compose up --build -d
42 ls
43 nano docker-compose.prod.yml
44 curl -fsSL https://get.docker.com -o get-docker.sh
45 sudo sh get-docker.sh
46 history

curl -fsSL https://get.docker.com | sudo bash
sudo usermod -aG docker $USER

docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up --build -d
