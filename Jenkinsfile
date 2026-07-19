pipeline {
    agent any
    
    environment {
        DOCKER_IMAGE = "karthiksaravanan3/task-api"
        DOCKER_TAG = "${BUILD_NUMBER}"
    }
    
    stages {
        stage('Clone Repository') {
            steps {
                echo '📥 Cloning repository from GitHub...'
                git branch: 'dev',
                    url: 'https://github.com/KAAARTHIKK/devops_project.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                echo '📦 Skipping npm install - will be done in Docker build...'
                sh 'echo "Dependencies will be installed during Docker build"'
            }
        }        

        stage('Run Tests') {
            steps {
                echo '🧪 Running tests...'
                // Build a throwaway test image (source is COPY'd in at build time, streamed to the
                // daemon as a tar context) instead of bind-mounting the workspace — bind mounts
                // resolve host-side under Docker-outside-of-Docker, which produced an empty /app.
                sh "docker build -f Dockerfile.test -t test-image-${BUILD_NUMBER} ."
                sh "docker network create test-net-${BUILD_NUMBER}"
                sh "docker run -d --name test-redis-${BUILD_NUMBER} --network test-net-${BUILD_NUMBER} redis:7-alpine"
                sh "sleep 2"
                sh "docker run --rm --network test-net-${BUILD_NUMBER} -e REDIS_URL=redis://test-redis-${BUILD_NUMBER}:6379 test-image-${BUILD_NUMBER}"
            }
            post {
                always {
                    sh "docker rm -f test-redis-${BUILD_NUMBER} || true"
                    sh "docker network rm test-net-${BUILD_NUMBER} || true"
                    sh "docker rmi test-image-${BUILD_NUMBER} || true"
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                echo '🐳 Building Docker image...'
                sh "docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} ."
                sh "docker tag ${DOCKER_IMAGE}:${DOCKER_TAG} ${DOCKER_IMAGE}:latest"
            }
        }
        
        stage('Push to DockerHub') {
            steps {
                echo '📤 Pushing image to DockerHub...'
                
                withDockerRegistry(credentialsId: 'dockerhub', url: '') {
                    sh "docker push ${DOCKER_IMAGE}:${DOCKER_TAG}"
                    sh "docker push ${DOCKER_IMAGE}:latest"
                }
            }
        }
        
        stage('Clean Up') {
            steps {
                echo '🧹 Cleaning up local Docker images...'
                sh "docker rmi ${DOCKER_IMAGE}:${DOCKER_TAG} || true"
                sh "docker rmi ${DOCKER_IMAGE}:latest || true"
            }
        }
    }
    
    post {
        success {
            echo '✅ Pipeline completed successfully!'
        }
        failure {
            echo '❌ Pipeline failed. Check logs above.'
        }
    }
}

