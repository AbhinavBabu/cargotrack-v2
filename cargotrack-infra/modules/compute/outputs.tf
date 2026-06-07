output "external_alb_arn" {
  value = aws_lb.external.arn
}

output "external_alb_dns_name" {
  value = aws_lb.external.dns_name
}

output "internal_alb_arn" {
  value = aws_lb.internal.arn
}

output "internal_alb_dns_name" {
  value = aws_lb.internal.dns_name
}

output "frontend_target_group_arn" {
  value = aws_lb_target_group.frontend.arn
}

output "backend_target_group_arn" {
  value = aws_lb_target_group.backend.arn
} 
