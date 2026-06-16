-- Add celebrated_at to sessions: timestamp коли конфеті-анімація
-- була показана для повністю виконаної сесії. nullable.
alter table sessions add column celebrated_at bigint;
