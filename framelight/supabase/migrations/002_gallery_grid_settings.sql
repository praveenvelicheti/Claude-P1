-- Add grid layout controls to galleries
alter table galleries
  add column if not exists grid_cols int default 3,
  add column if not exists grid_gutter int default 8;
