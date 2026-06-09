module "networking" {

  source = "../../modules/networking"

  project_name = var.project_name
  vpc_cidr     = var.vpc_cidr
}

module "security" {

  source = "../../modules/security"

  project_name = var.project_name

  vpc_id = module.networking.vpc_id
}

module "compute" {

  source = "../../modules/compute"

  project_name = var.project_name

  vpc_id = module.networking.vpc_id

  public_subnet_ids = module.networking.public_subnet_ids
  web_subnet_ids    = module.networking.web_subnet_ids
  app_subnet_ids    = module.networking.app_subnet_ids

  external_alb_sg_id = module.security.external_alb_sg_id
  frontend_sg_id     = module.security.frontend_sg_id
  internal_alb_sg_id = module.security.internal_alb_sg_id
  backend_sg_id      = module.security.backend_sg_id

  db_secret_arn  = module.database.db_secret_arn
  app_secret_arn = module.database.application_secret_arn
  kms_key_arn    = module.database.kms_key_arn

  documents_bucket_arn = module.storage.bucket_arn
  documents_bucket_id  = module.storage.bucket_id

  aws_region     = var.aws_region
  event_bus_name = module.eventing.event_bus_name
}

module "database" {

  source = "../../modules/database"

  project_name = var.project_name

  db_subnet_ids = module.networking.db_subnet_ids

  database_sg_id = module.security.database_sg_id
}

module "storage" {

  source = "../../modules/storage"

  project_name = var.project_name

  kms_key_arn = module.database.kms_key_arn
}

module "monitoring" {

  source = "../../modules/monitoring"

  project_name = var.project_name
  aws_region   = var.aws_region

  backend_asg_name        = module.compute.backend_asg_name
  external_alb_arn_suffix = module.compute.external_alb_arn_suffix
  db_identifier           = module.database.db_identifier

  alarm_email = var.alarm_email
  kms_key_arn = module.database.kms_key_arn
}

module "audit" {

  source = "../../modules/audit"

  project_name = var.project_name
  kms_key_arn  = module.database.kms_key_arn
}

module "eventing" {

  source = "../../modules/eventing"

  project_name = var.project_name
  aws_region   = var.aws_region

  kms_key_arn      = module.database.kms_key_arn
  audit_table_name = module.audit.table_name
  audit_table_arn  = module.audit.table_arn
}

module "cdn" {

  source = "../../modules/cdn"

  project_name = var.project_name
  alb_dns_name = module.compute.external_alb_dns_name
}

module "endpoints" {

  source = "../../modules/endpoints"

  project_name   = var.project_name
  vpc_id         = module.networking.vpc_id
  aws_region     = var.aws_region
  app_subnet_ids = module.networking.app_subnet_ids
  backend_sg_id  = module.security.backend_sg_id

  private_route_table_ids = [
    module.networking.web_route_table_id,
    module.networking.app_route_table_id,
    module.networking.db_route_table_id,
  ]
}

# ---------------------------------------------------------------------------
# Terraform Registry Module Integration
#
# Source  : terraform-aws-modules/cloudwatch/aws//modules/metric-alarm ~> 5.0
# Registry: https://registry.terraform.io/modules/terraform-aws-modules/cloudwatch/aws
#
# Business justification:
#   The EventBridge → SQS → Lambda → DynamoDB audit pipeline is mission-
#   critical in prod. The custom modules/monitoring module monitors EC2 CPU,
#   RDS CPU, and ALB metrics — but Lambda execution errors on the document
#   processor are currently unmonitored.
#
#   A single Lambda error in prod means a shipment document was processed
#   but the audit record was NOT written to DynamoDB. This is a silent data
#   integrity failure: operations staff would have no notification, and the
#   audit gap would only surface during a compliance review.
#
#   This alarm pages the prod ops team within 5 minutes of any Lambda error,
#   using the same SNS topic already provisioned by modules/monitoring.
#
# Why this is a registry module and not a custom resource:
#   terraform-aws-modules/cloudwatch/aws is the standard community module
#   for CloudWatch alarms. Using it here demonstrates registry module
#   integration and reduces boilerplate for future alarm additions.
#
# Migration risk: ZERO — prod is never applied. No dev resource is affected.
# ---------------------------------------------------------------------------

module "lambda_errors_alarm" {

  source  = "terraform-aws-modules/cloudwatch/aws//modules/metric-alarm"
  version = "~> 5.0"

  alarm_name          = "${var.project_name}-lambda-errors"
  alarm_description   = "Document processor Lambda errors — audit records may not be written to DynamoDB"
  actions_enabled     = true

  # Re-use the ops SNS topic already created by modules/monitoring
  alarm_actions             = [module.monitoring.sns_topic_arn]
  ok_actions                = [module.monitoring.sns_topic_arn]
  insufficient_data_actions = []

  # AWS/Lambda Errors metric — any error in prod triggers the alarm
  namespace   = "AWS/Lambda"
  metric_name = "Errors"
  statistic   = "Sum"

  dimensions = {
    FunctionName = module.eventing.lambda_function_name
  }

  # Alert after 1 evaluation period (5 min) with at least 1 error
  period              = 300
  evaluation_periods  = 1
  threshold           = 0
  comparison_operator = "GreaterThanThreshold"

  # Missing data means Lambda was never invoked — not an alarm condition
  treat_missing_data = "notBreaching"

  tags = {
    Project     = var.project_name
    ManagedBy   = "Terraform"
    Environment = "prod"
    Purpose     = "Document processing pipeline integrity"
  }
}
