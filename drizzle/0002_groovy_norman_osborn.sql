CREATE TABLE "attendance" (
	"id" text PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"branch_id" text NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"clock_in" timestamp NOT NULL,
	"clock_out" timestamp,
	"device_id" text,
	"status" text DEFAULT 'PRESENT',
	"total_hours" real DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "batch_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_id" text NOT NULL,
	"stock_movement_id" integer NOT NULL,
	"quantity_used" real NOT NULL,
	"cost_at_time" real NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaign_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"customer_id" text,
	"channel" text NOT NULL,
	"sent_at" timestamp DEFAULT now(),
	"delivered" boolean DEFAULT false,
	"opened" boolean DEFAULT false,
	"clicked" boolean DEFAULT false,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"target_audience" text,
	"content" text NOT NULL,
	"scheduled_at" timestamp,
	"reach" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"revenue" real DEFAULT 0,
	"budget" real DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chart_of_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"name_ar" text,
	"type" text NOT NULL,
	"normal_balance" text NOT NULL,
	"parent_id" text,
	"is_active" boolean DEFAULT true,
	"is_control_account" boolean DEFAULT false,
	"allow_manual_journals" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "chart_of_accounts_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "cost_centers" (
	"id" text PRIMARY KEY NOT NULL,
	"branch_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "cost_centers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "day_close_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"branch_id" text NOT NULL,
	"shift_id" text,
	"closed_by" text NOT NULL,
	"date" date NOT NULL,
	"expected_cash" real DEFAULT 0 NOT NULL,
	"actual_cash" real DEFAULT 0 NOT NULL,
	"variance" real DEFAULT 0 NOT NULL,
	"payment_breakdown" json,
	"total_orders" integer DEFAULT 0,
	"total_revenue" real DEFAULT 0,
	"total_refunds" real DEFAULT 0,
	"total_discounts" real DEFAULT 0,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"approved_by" text,
	"approved_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "delivery_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"driver_id" text NOT NULL,
	"branch_id" text NOT NULL,
	"status" text DEFAULT 'ASSIGNED' NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"picked_up_at" timestamp,
	"delivered_at" timestamp,
	"failure_reason" text,
	"proof_photo_url" text,
	"customer_rating" integer,
	"distance_km" real,
	"delivery_time_minutes" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "delivery_platforms" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"fee_percentage" real DEFAULT 0,
	"integration_type" text DEFAULT 'MANUAL',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "delivery_zones" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_ar" text,
	"branch_id" text NOT NULL,
	"delivery_fee" real DEFAULT 0,
	"min_order_amount" real DEFAULT 0,
	"estimated_time" integer DEFAULT 45,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"branch_id" text,
	"status" text DEFAULT 'AVAILABLE',
	"current_cash_balance" real DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" text PRIMARY KEY NOT NULL,
	"branch_id" text NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"name_ar" text,
	"phone" text,
	"email" text,
	"role" text NOT NULL,
	"basic_salary" real DEFAULT 0 NOT NULL,
	"hourly_rate" real DEFAULT 0,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "eta_dead_letters" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" text,
	"branch_id" text,
	"payload" json NOT NULL,
	"attempts" integer DEFAULT 0,
	"last_error" text,
	"status" text DEFAULT 'PENDING',
	"dismissed_by" text,
	"dismissed_at" timestamp,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fiscal_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" text,
	"branch_id" text,
	"status" text NOT NULL,
	"attempt" integer DEFAULT 0,
	"last_error" text,
	"payload" json,
	"response" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fiscal_periods" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"closed_by" text,
	"closed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "floor_zones" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"branch_id" text NOT NULL,
	"width" integer DEFAULT 800,
	"height" integer DEFAULT 600,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "franchise_configurations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"branch_id" text NOT NULL,
	"contract_type" text DEFAULT 'STANDARD',
	"royalty_percentage" real DEFAULT 0,
	"marketing_fee_percentage" real DEFAULT 0,
	"contract_start_date" date,
	"contract_end_date" date,
	"allow_menu_override" boolean DEFAULT false,
	"allow_pricing_override" boolean DEFAULT false,
	"settings" json DEFAULT '{}'::json,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "idempotency_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"scope" text DEFAULT 'ORDER_CREATE' NOT NULL,
	"request_hash" text NOT NULL,
	"resource_id" text,
	"response_code" integer,
	"response_body" json,
	"status" text DEFAULT 'IN_PROGRESS' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "images" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"url" text NOT NULL,
	"filename" text,
	"content_type" text,
	"width" integer,
	"height" integer,
	"size" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inventory_batches" (
	"id" text PRIMARY KEY NOT NULL,
	"item_id" text NOT NULL,
	"warehouse_id" text NOT NULL,
	"batch_number" text NOT NULL,
	"received_date" timestamp DEFAULT now() NOT NULL,
	"expiry_date" timestamp NOT NULL,
	"initial_qty" real NOT NULL,
	"current_qty" real NOT NULL,
	"unit_cost" real NOT NULL,
	"supplier_id" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"entry_number" serial NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"reference" text,
	"reference_type" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'POSTED' NOT NULL,
	"fiscal_period_id" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "journal_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"journal_entry_id" text NOT NULL,
	"account_id" text NOT NULL,
	"cost_center_id" text,
	"debit" real DEFAULT 0 NOT NULL,
	"credit" real DEFAULT 0 NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"branch_id" text NOT NULL,
	"type" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"days" integer NOT NULL,
	"reason" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"approved_by" text,
	"approved_at" timestamp,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "manager_approvals" (
	"id" serial PRIMARY KEY NOT NULL,
	"manager_id" text NOT NULL,
	"branch_id" text NOT NULL,
	"action_type" text NOT NULL,
	"related_id" text,
	"reason" text NOT NULL,
	"details" json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_method_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"payment_method" text NOT NULL,
	"account_id" text NOT NULL,
	"branch_id" text,
	CONSTRAINT "payment_method_accounts_payment_method_unique" UNIQUE("payment_method")
);
--> statement-breakpoint
CREATE TABLE "payroll_cycles" (
	"id" text PRIMARY KEY NOT NULL,
	"branch_id" text NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"total_amount" real DEFAULT 0,
	"executed_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payroll_payouts" (
	"id" text PRIMARY KEY NOT NULL,
	"cycle_id" text NOT NULL,
	"employee_id" text NOT NULL,
	"basic_salary" real NOT NULL,
	"deductions" real DEFAULT 0,
	"overtime" real DEFAULT 0,
	"net_pay" real NOT NULL,
	"status" text DEFAULT 'PENDING',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "permission_definitions" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"name_ar" text,
	"description" text,
	"description_ar" text,
	"category" text NOT NULL,
	"category_ar" text,
	"sub_category" text,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"depends_on" json DEFAULT '[]'::json,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "permission_definitions_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "production_order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"production_order_id" text NOT NULL,
	"inventory_item_id" text NOT NULL,
	"required_qty" real NOT NULL,
	"actual_qty" real,
	"unit" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "production_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"branch_id" text NOT NULL,
	"recipe_id" text NOT NULL,
	"batch_size" real DEFAULT 1 NOT NULL,
	"expected_yield" real NOT NULL,
	"actual_yield" real,
	"status" text DEFAULT 'PLANNED' NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"warehouse_id" text,
	"notes" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "purchase_order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"po_id" text NOT NULL,
	"item_id" text NOT NULL,
	"ordered_qty" real NOT NULL,
	"received_qty" real DEFAULT 0,
	"unit_price" real NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"supplier_id" text NOT NULL,
	"branch_id" text NOT NULL,
	"status" text DEFAULT 'DRAFT',
	"expected_date" timestamp,
	"subtotal" real DEFAULT 0,
	"notes" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "recipe_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"recipe_id" text NOT NULL,
	"version" integer NOT NULL,
	"yield" real DEFAULT 1,
	"instructions" text,
	"ingredients_snapshot" json,
	"calculated_cost" real,
	"changed_by" text,
	"change_reason" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "refund_records" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"branch_id" text NOT NULL,
	"amount" real NOT NULL,
	"refund_method" text NOT NULL,
	"reason" text NOT NULL,
	"reason_category" text,
	"items" json,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"requested_by" text NOT NULL,
	"approved_by" text,
	"approved_at" timestamp,
	"processed_at" timestamp,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" text PRIMARY KEY NOT NULL,
	"branch_id" text NOT NULL,
	"table_id" text,
	"customer_id" text,
	"customer_name" text NOT NULL,
	"customer_phone" text NOT NULL,
	"date" date NOT NULL,
	"time" text NOT NULL,
	"party_size" integer DEFAULT 2 NOT NULL,
	"duration" integer DEFAULT 90,
	"status" text DEFAULT 'CONFIRMED' NOT NULL,
	"special_requests" text,
	"notes" text,
	"source" text DEFAULT 'PHONE',
	"created_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_ar" text,
	"description" text,
	"description_ar" text,
	"permissions" json DEFAULT '[]'::json,
	"is_system" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"priority" integer DEFAULT 0,
	"color" text DEFAULT '#6366f1',
	"icon" text DEFAULT 'user',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" json NOT NULL,
	"category" text DEFAULT 'general',
	"updated_by" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" text PRIMARY KEY NOT NULL,
	"branch_id" text NOT NULL,
	"user_id" text NOT NULL,
	"opening_time" timestamp DEFAULT now() NOT NULL,
	"closing_time" timestamp,
	"opening_balance" real DEFAULT 0 NOT NULL,
	"expected_balance" real DEFAULT 0,
	"actual_balance" real DEFAULT 0,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tables" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"zone_id" text,
	"branch_id" text NOT NULL,
	"x" integer DEFAULT 0,
	"y" integer DEFAULT 0,
	"width" integer DEFAULT 100,
	"height" integer DEFAULT 100,
	"shape" text DEFAULT 'rectangle',
	"seats" integer DEFAULT 4,
	"status" text DEFAULT 'AVAILABLE' NOT NULL,
	"current_order_id" text,
	"locked_by_user_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tax_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"tax_type" text NOT NULL,
	"account_id" text NOT NULL,
	"rate" real NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token_id" text NOT NULL,
	"device_name" text,
	"user_agent" text,
	"ip_address" text,
	"is_active" boolean DEFAULT true,
	"revoked_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"last_seen_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_sessions_token_id_unique" UNIQUE("token_id")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text,
	"customer_phone" text NOT NULL,
	"direction" text NOT NULL,
	"content" text NOT NULL,
	"message_type" text DEFAULT 'TEXT',
	"template_id" text,
	"status" text DEFAULT 'SENT' NOT NULL,
	"external_id" text,
	"failure_reason" text,
	"campaign_id" text,
	"order_id" text,
	"sent_at" timestamp DEFAULT now(),
	"delivered_at" timestamp,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "signature_version" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "is_verified" boolean;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "last_verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD COLUMN "purchase_price" real DEFAULT 0;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD COLUMN "is_audited" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD COLUMN "audit_frequency" text DEFAULT 'DAILY';--> statement-breakpoint
ALTER TABLE "inventory_items" ADD COLUMN "is_composite" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD COLUMN "bom" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "menu_categories" ADD COLUMN "target_order_types" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "menu_categories" ADD COLUMN "menu_ids" json DEFAULT '["menu-1"]'::json;--> statement-breakpoint
ALTER TABLE "menu_categories" ADD COLUMN "printer_ids" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "status" text DEFAULT 'published';--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "approved_by" text;--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "published_at" timestamp;--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "previous_price" real;--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "pending_price" real;--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "price_change_reason" text;--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "price_approved_by" text;--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "price_approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "modifier_groups" json;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "cost" real DEFAULT 0;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "seat_number" integer;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "course" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tip_amount" real DEFAULT 0;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shift_id" text;--> statement-breakpoint
ALTER TABLE "printers" ADD COLUMN "code" text;--> statement-breakpoint
ALTER TABLE "printers" ADD COLUMN "role" text DEFAULT 'OTHER';--> statement-breakpoint
ALTER TABLE "printers" ADD COLUMN "is_primary_cashier" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "printers" ADD COLUMN "last_heartbeat_at" timestamp;--> statement-breakpoint
ALTER TABLE "printers" ADD COLUMN "heartbeat_status" text DEFAULT 'UNKNOWN';--> statement-breakpoint
ALTER TABLE "printers" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD COLUMN "last_known_cost" real;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD COLUMN "last_cost_update" timestamp;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "version" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "current_version_id" text;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "calculated_cost" real;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "last_cost_calculation" timestamp;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD COLUMN "unit_cost" real DEFAULT 0;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD COLUMN "total_cost" real DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pin_code" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pin_code_hash" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "custom_permissions" json DEFAULT '{}'::json;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "allowed_branches" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "manager_pin" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "mfa_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "mfa_secret" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pin_login_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "warehouses" ADD COLUMN "name_ar" text;--> statement-breakpoint
ALTER TABLE "warehouses" ADD COLUMN "parent_id" text;--> statement-breakpoint
ALTER TABLE "warehouses" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_transactions" ADD CONSTRAINT "batch_transactions_batch_id_inventory_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."inventory_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_transactions" ADD CONSTRAINT "batch_transactions_stock_movement_id_stock_movements_id_fk" FOREIGN KEY ("stock_movement_id") REFERENCES "public"."stock_movements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_logs" ADD CONSTRAINT "campaign_logs_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_logs" ADD CONSTRAINT "campaign_logs_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_centers" ADD CONSTRAINT "cost_centers_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "day_close_reports" ADD CONSTRAINT "day_close_reports_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "day_close_reports" ADD CONSTRAINT "day_close_reports_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "day_close_reports" ADD CONSTRAINT "day_close_reports_closed_by_users_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "day_close_reports" ADD CONSTRAINT "day_close_reports_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_assignments" ADD CONSTRAINT "delivery_assignments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_assignments" ADD CONSTRAINT "delivery_assignments_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_assignments" ADD CONSTRAINT "delivery_assignments_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_zones" ADD CONSTRAINT "delivery_zones_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiscal_periods" ADD CONSTRAINT "fiscal_periods_closed_by_users_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "floor_zones" ADD CONSTRAINT "floor_zones_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "franchise_configurations" ADD CONSTRAINT "franchise_configurations_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_batches" ADD CONSTRAINT "inventory_batches_item_id_inventory_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."inventory_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_batches" ADD CONSTRAINT "inventory_batches_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_cost_center_id_cost_centers_id_fk" FOREIGN KEY ("cost_center_id") REFERENCES "public"."cost_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manager_approvals" ADD CONSTRAINT "manager_approvals_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manager_approvals" ADD CONSTRAINT "manager_approvals_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_method_accounts" ADD CONSTRAINT "payment_method_accounts_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_method_accounts" ADD CONSTRAINT "payment_method_accounts_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_cycles" ADD CONSTRAINT "payroll_cycles_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_cycles" ADD CONSTRAINT "payroll_cycles_executed_by_users_id_fk" FOREIGN KEY ("executed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_payouts" ADD CONSTRAINT "payroll_payouts_cycle_id_payroll_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."payroll_cycles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_payouts" ADD CONSTRAINT "payroll_payouts_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_order_items" ADD CONSTRAINT "production_order_items_production_order_id_production_orders_id_fk" FOREIGN KEY ("production_order_id") REFERENCES "public"."production_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_order_items" ADD CONSTRAINT "production_order_items_inventory_item_id_inventory_items_id_fk" FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_po_id_purchase_orders_id_fk" FOREIGN KEY ("po_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_item_id_inventory_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."inventory_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_versions" ADD CONSTRAINT "recipe_versions_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_versions" ADD CONSTRAINT "recipe_versions_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund_records" ADD CONSTRAINT "refund_records_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund_records" ADD CONSTRAINT "refund_records_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund_records" ADD CONSTRAINT "refund_records_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund_records" ADD CONSTRAINT "refund_records_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_table_id_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tables" ADD CONSTRAINT "tables_zone_id_floor_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."floor_zones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tables" ADD CONSTRAINT "tables_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_accounts" ADD CONSTRAINT "tax_accounts_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idempotency_keys_key_scope_idx" ON "idempotency_keys" USING btree ("key","scope");--> statement-breakpoint
CREATE INDEX "fefo_idx" ON "inventory_batches" USING btree ("item_id","warehouse_id","expiry_date","status");--> statement-breakpoint
CREATE INDEX "je_ref_idx" ON "journal_entries" USING btree ("reference","reference_type");--> statement-breakpoint
CREATE INDEX "jl_acc_cc_idx" ON "journal_lines" USING btree ("account_id","cost_center_id");--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_price_approved_by_users_id_fk" FOREIGN KEY ("price_approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;