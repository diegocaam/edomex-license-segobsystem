import {
  pgTable,
  uuid,
  text,
  date,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core'
export const licenses = pgTable('licenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  token: uuid('token').notNull().unique().defaultRandom(),
  name: text('name').notNull(),
  curp: text('curp').notNull().default(''),
  folio: text('folio').notNull().unique(),
  type: text('type').notNull(),
  issued: date('issued').notNull(),
  expires: date('expires').notNull(),
  suspended: boolean('suspended').notNull().default(false),
  photo: uuid('photo').notNull(),
  notes: text('notes').notNull().default(''),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})
