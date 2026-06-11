output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name — use this URL to access the frontend"
  value       = module.cdn.cloudfront_domain_name
}
