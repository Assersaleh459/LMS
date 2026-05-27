-- School settings enhancements
-- Adds WhatsApp webhook URL so admins can manage it from the UI

alter table schools
  add column if not exists whatsapp_webhook_url text,
  add column if not exists phone        text,
  add column if not exists address_ar   text;
