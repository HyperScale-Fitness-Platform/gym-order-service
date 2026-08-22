pipeline {
  agent any
  environment {
    ECR_REPO_NAME = "gym-order-service"
    KUBERNETES_DIR = "${WORKSPACE}/k8s"
    NAMESPACE = "gym-dev"
    AWS_REGION = "us-east-1"
    CLUSTER_NAME = "gym-cluster"
    IMAGE_TAG = "${env.GIT_COMMIT ? env.GIT_COMMIT.take(7) : 'latest'}"
    AWS_ACCESS_KEY_ID = credentials('aws-access-key-id')
    AWS_SECRET_ACCESS_KEY = credentials('aws-secret-access-key')
    AWS_ACCOUNT_ID = credentials('aws-account-id')
  }
  stages {
    stage('Checkout') { steps { checkout scm } }
    stage('Build and Push') { steps {
      sh "aws ecr get-login-password --region ${env.AWS_REGION} | docker login --username AWS --password-stdin ${env.AWS_ACCOUNT_ID}.dkr.ecr.${env.AWS_REGION}.amazonaws.com"
      sh "docker build -t ${env.AWS_ACCOUNT_ID}.dkr.ecr.${env.AWS_REGION}.amazonaws.com/${env.ECR_REPO_NAME}:${env.IMAGE_TAG} ."
      sh "docker push ${env.AWS_ACCOUNT_ID}.dkr.ecr.${env.AWS_REGION}.amazonaws.com/${env.ECR_REPO_NAME}:${env.IMAGE_TAG}"
    } }
    stage('Deploy') { steps {
      sh "aws eks update-kubeconfig --region ${env.AWS_REGION} --name ${env.CLUSTER_NAME}"
      sh "kubectl apply -f ${env.KUBERNETES_DIR}"
      sh "kubectl rollout status deployment/gym-order-service -n ${env.NAMESPACE} --timeout=120s"
    } }
  }
}
