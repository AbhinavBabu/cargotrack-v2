variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "alb_dns_name" {
  description = "DNS name of the external Application Load Balancer (CloudFront origin)"
  type        = string
}
