import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  int,
  boolean,
  timestamp,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// --- Enums ---
export const projectStatusEnum = mysqlEnum("project_status", [
  "planning",
  "active",
  "paused",
  "completed",
  "cancelled",
]);

export const taskTypeEnum = mysqlEnum("task_type", [
  "task",
  "delivery_doc",
  "delivery_dev",
  "convocation",
  "meeting",
  "incidence",
]);

export const taskStatusEnum = mysqlEnum("task_status", [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
]);

export const riskStatusEnum = mysqlEnum("risk_status", [
  "open",
  "mitigated",
  "closed",
]);

// --- Tabela: users ---
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  role: varchar("role", { length: 50 }).notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// --- Tabela: projects ---
export const projects = mysqlTable("projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  objective: text("objective"),
  agency: varchar("agency", { length: 255 }),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  description: text("description"),
  status: projectStatusEnum.default("planning").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// --- Tabela: team_members ---
export const teamMembers = mysqlTable("team_members", {
  id: serial("id").primaryKey(),
  projectId: int("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  registration: varchar("registration", { length: 100 }),
  role: varchar("role", { length: 100 }),
  department: varchar("department", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  isResponsible: boolean("is_responsible").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// --- Tabela: tasks ---
export const tasks = mysqlTable("tasks", {
  id: serial("id").primaryKey(),
  projectId: int("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  responsibleId: int("responsible_id").references(() => teamMembers.id, {
    onDelete: "set null",
  }),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: taskStatusEnum.default("pending").notNull(),
  progress: int("progress").default(0).notNull(),
  type: taskTypeEnum.default("task").notNull(),
  seiNumber: varchar("sei_number", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// --- Tabela: task_participants ---
export const taskParticipants = mysqlTable("task_participants", {
  id: serial("id").primaryKey(),
  taskId: int("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  registration: varchar("registration", { length: 100 }),
  cpf: varchar("cpf", { length: 14 }),
  birthDate: timestamp("birth_date"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  department: varchar("department", { length: 255 }),
  notes: text("notes"),
  origin: varchar("origin", { length: 255 }),
  destination: varchar("destination", { length: 255 }),
  period: varchar("period", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// --- Tabela: task_risk_impacts ---
export const taskRiskImpacts = mysqlTable("task_risk_impacts", {
  id: serial("id").primaryKey(),
  taskId: int("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  incidenceId: int("incidence_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  delayDays: int("delay_days").notNull(),
});

// --- Tabela: risks ---
export const risks = mysqlTable("risks", {
  id: serial("id").primaryKey(),
  projectId: int("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  probability: int("probability").notNull(),
  impact: int("impact").notNull(),
  criticality: int("criticality").notNull(),
  mitigation: text("mitigation"),
  status: riskStatusEnum.default("open").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// --- Relacionamentos Drizzle ---
export const projectsRelations = relations(projects, ({ many }) => ({
  teamMembers: many(teamMembers),
  tasks: many(tasks),
  risks: many(risks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
  responsible: one(teamMembers, { fields: [tasks.responsibleId], references: [teamMembers.id] }),
  participants: many(taskParticipants),
  riskImpactsReceived: many(taskRiskImpacts, { relationName: "affected_task" }),
  riskImpactsCaused: many(taskRiskImpacts, { relationName: "incidence_source" }),
}));

export const taskRiskImpactsRelations = relations(taskRiskImpacts, ({ one }) => ({
  task: one(tasks, {
    fields: [taskRiskImpacts.taskId],
    references: [tasks.id],
    relationName: "affected_task",
  }),
  incidence: one(tasks, {
    fields: [taskRiskImpacts.incidenceId],
    references: [tasks.id],
    relationName: "incidence_source",
  }),
}));