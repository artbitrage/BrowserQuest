import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  x: integer('x').notNull().default(0),
  y: integer('y').notNull().default(0),
  kind: integer('kind').notNull().default(1),
  hp: integer('hp').notNull().default(100),
  maxHp: integer('max_hp').notNull().default(100),
  experience: integer('experience').notNull().default(0),
  weapon: integer('weapon').notNull().default(60), // SWORD1
  armor: integer('armor').notNull().default(21), // CLOTHARMOR
  lastLogin: integer('last_login', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const inventories = sqliteTable('inventories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  itemKind: integer('item_kind').notNull(),
  slot: integer('slot').notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Inventory = typeof inventories.$inferSelect;
export type NewInventory = typeof inventories.$inferInsert;
