CREATE TYPE "public"."session_status" AS ENUM('PENDING_REVIEW', 'PENDING_VALIDATION', 'VALIDATED', 'REJECTED', 'PAID');--> statement-breakpoint
CREATE TYPE "public"."session_type" AS ENUM('RCD', 'DEVOIRS_FAITS', 'AUTRE');--> statement-breakpoint
CREATE TYPE "public"."time_slot" AS ENUM('M1', 'M2', 'M3', 'M4', 'S1', 'S2', 'S3', 'S4');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('TEACHER', 'SECRETARY', 'PRINCIPAL', 'ADMIN');--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"filename" text NOT NULL,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"uploaded_by" text NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"is_verified" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"time_slot" time_slot NOT NULL,
	"type" "session_type" NOT NULL,
	"teacher_id" integer NOT NULL,
	"teacher_name" text NOT NULL,
	"status" "session_status" DEFAULT 'PENDING_REVIEW' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"updated_by" text,
	"class_name" text,
	"replaced_teacher_prefix" text,
	"replaced_teacher_last_name" text,
	"replaced_teacher_first_name" text,
	"subject" text,
	"grade_level" text,
	"student_count" integer,
	"description" text,
	"comment" text,
	"review_comments" text,
	"validation_comments" text,
	"rejection_reason" text
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" text,
	CONSTRAINT "system_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"role" "user_role" DEFAULT 'TEACHER' NOT NULL,
	"initials" text,
	"signature" text,
	"in_pacte" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
