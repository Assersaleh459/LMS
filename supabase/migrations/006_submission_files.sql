-- Add file_url column to assignment_submissions for photo/file uploads
alter table assignment_submissions
  add column if not exists file_url text;
