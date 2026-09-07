import { z } from "zod";

export const listItemSchema = z.object({
  title: z.string().min(1),
  body: z.string().optional().or(z.literal("")),
});

export const milestoneSchema = z.object({
  name: z.string().min(1),
  date: z.string().optional().or(z.literal("")),
});

export const sowFormDataSchema = z.object({
  project_summary: z.string().optional().or(z.literal("")),
  functional_requirements: z.array(listItemSchema).default([]),
  integrations: z.array(listItemSchema).default([]),
  user_roles: z.array(listItemSchema).default([]),
  deliverables: z.array(z.string()).default([]),
  client_responsibilities_additional: z.string().optional().or(z.literal("")),
  start_date: z.string().optional().or(z.literal("")),
  estimated_completion_date: z.string().optional().or(z.literal("")),
  milestones: z.array(milestoneSchema).default([]),
  additional_deadlines: z.string().optional().or(z.literal("")),
  timeline_constraints: z.string().optional().or(z.literal("")),
  pricing: z.object({
    development: z.coerce.number().default(0),
    data_migration: z.coerce.number().default(0),
    integrations_cost: z.coerce.number().default(0),
    other: z.coerce.number().default(0),
    taxes: z.coerce.number().default(0),
  }),
  recurring: z.object({
    support_maintenance: z.coerce.number().default(0),
    hosting: z.coerce.number().default(0),
    third_party: z.coerce.number().default(0),
    additional_support: z.coerce.number().default(0),
  }),
  support_included_other: z.string().optional().or(z.literal("")),
  support_excluded_other: z.string().optional().or(z.literal("")),
  hosting_provider: z.string().optional().or(z.literal("")),
  database_provider: z.string().optional().or(z.literal("")),
  other_services: z.string().optional().or(z.literal("")),
  third_party_costs: z.array(z.string()).default([]),
  testing_requirements: z.array(z.string()).default([]),
  acceptance_days: z.coerce.number().default(7),
  assumptions: z.array(z.string()).default([]),
  constraints: z.array(z.string()).default([]),
  exclusions: z.array(z.string()).default([]),
  csa_number: z.string().optional().or(z.literal("")),
  csa_date: z.string().optional().or(z.literal("")),
});

export type SowFormData = z.infer<typeof sowFormDataSchema>;

export const defaultSowFormData: SowFormData = {
  project_summary: "",
  functional_requirements: [],
  integrations: [],
  user_roles: [],
  deliverables: [],
  client_responsibilities_additional: "",
  start_date: "",
  estimated_completion_date: "",
  milestones: [
    { name: "1st Review", date: "" },
    { name: "2nd Review", date: "" },
    { name: "Final Review", date: "" },
    { name: "Deployment", date: "" },
  ],
  additional_deadlines: "",
  timeline_constraints: "",
  pricing: { development: 0, data_migration: 0, integrations_cost: 0, other: 0, taxes: 0 },
  recurring: { support_maintenance: 0, hosting: 0, third_party: 0, additional_support: 0 },
  support_included_other: "",
  support_excluded_other: "",
  hosting_provider: "",
  database_provider: "",
  other_services: "",
  third_party_costs: [],
  testing_requirements: [],
  acceptance_days: 7,
  assumptions: [],
  constraints: [],
  exclusions: [],
  csa_number: "",
  csa_date: "",
};