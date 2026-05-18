-- Custom User Table (extends Django's AbstractUser)
CREATE TABLE "accounts_customuser" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "password" varchar(128) NOT NULL,
    "last_login" datetime NULL,
    "is_superuser" bool NOT NULL,
    "username" varchar(150) NOT NULL UNIQUE,
    "first_name" varchar(150) NOT NULL,
    "last_name" varchar(150) NOT NULL,
    "email" varchar(254) NOT NULL,
    "is_staff" bool NOT NULL,
    "is_active" bool NOT NULL,
    "date_joined" datetime NOT NULL,
    "role" varchar(10) NOT NULL,
    "bio" text NOT NULL,
    "created_at" datetime NOT NULL
);

-- Classroom Table
CREATE TABLE "visualizer_classroom" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" varchar(200) NOT NULL,
    "description" text NOT NULL,
    "subject" varchar(100) NOT NULL,
    "join_code" varchar(10) NOT NULL UNIQUE,
    "banner_color" varchar(7) NOT NULL,
    "is_active" bool NOT NULL,
    "created_at" datetime NOT NULL,
    "updated_at" datetime NOT NULL,
    "teacher_id" bigint NOT NULL REFERENCES "accounts_customuser" ("id")
);

-- Class Membership Table (Student- Classroom relationship)
CREATE TABLE "visualizer_classmembership" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "joined_at" datetime NOT NULL,
    "classroom_id" bigint NOT NULL REFERENCES "visualizer_classroom" ("id"),
    "student_id" bigint NOT NULL REFERENCES "accounts_customuser" ("id"),
    UNIQUE("classroom_id", "student_id")
);

-- Equation Table
CREATE TABLE "visualizer_equation" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" varchar(200) NOT NULL,
    "equation_type" varchar(20) NOT NULL,
    "expression" text NOT NULL,
    "description" text NOT NULL,
    "is_public" bool NOT NULL,
    "created_at" datetime NOT NULL,
    "updated_at" datetime NOT NULL,
    "user_id" bigint NOT NULL REFERENCES "accounts_customuser" ("id"),
    "classroom_id" bigint NULL REFERENCES "visualizer_classroom" ("id")
);

-- Parameter Table (for equation variables)
CREATE TABLE "visualizer_parameter" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" varchar(10) NOT NULL,
    "label" varchar(50) NOT NULL,
    "min_value" real NOT NULL,
    "max_value" real NOT NULL,
    "default_value" real NOT NULL,
    "step" real NOT NULL,
    "equation_id" bigint NOT NULL REFERENCES "visualizer_equation" ("id")
);

-- Usage Log Table
CREATE TABLE "visualizer_usagelog" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "action" varchar(100) NOT NULL,
    "equation_type" varchar(20) NOT NULL,
    "expression" text NOT NULL,
    "timestamp" datetime NOT NULL,
    "ip_address" char(39) NULL,
    "user_id" bigint NULL REFERENCES "accounts_customuser" ("id")
);